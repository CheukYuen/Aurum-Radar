from __future__ import annotations

import json
import re
import time
import uuid
from collections.abc import Generator
from pathlib import Path
from typing import Any

from loguru import logger
from sqlalchemy.orm import Session

from app.agents.base import BaseAgent

_SKILL_DIR = (
    Path(__file__).resolve().parent.parent.parent / ".skills" / "intelligence-correlation-analysis"
)

# ---- Fix 2: module-level cache — read files once at import time ----

def _load_skill_cache() -> tuple[str, dict | None]:
    skill_md_text = _SKILL_DIR.joinpath("SKILL.md").read_text(encoding="utf-8")
    parts = skill_md_text.split("---", 2)
    skill_body = parts[2].strip() if len(parts) >= 3 else skill_md_text

    # Fix 3: strip the JSON schema block inside 第六步 to cut prompt size.
    # The block is irrelevant for plain-text output and slows model prefill.
    skill_body = re.sub(r"```json\n.*?```", "", skill_body, flags=re.DOTALL)

    refs_dir = _SKILL_DIR / "references"
    input_schema: dict | None = None
    schema_path = refs_dir / "input_schema.json"
    if schema_path.exists():
        input_schema = json.loads(schema_path.read_text(encoding="utf-8"))

    return skill_body, input_schema


_SKILL_BODY, _INPUT_SCHEMA = _load_skill_cache()

_PLAIN_TEXT_OVERRIDE = (
    "\n\n---\n\n## 执行覆盖指令（优先级最高，覆盖以上所有规则）\n\n"
    "### 1. 跳过第零步前置校验\n"
    "不执行 V1-V4 校验，不输出 ANALYSIS_REJECTED。"
    "对提供的所有事件直接执行分析；若某条事件字段不完整，"
    "在分析中注明「该事件数据不完整，仅作参考」，继续推进。\n\n"
    "### 2. 纯文本输出\n"
    "不输出任何 JSON、代码块或结构化标记。"
    "使用自然语言段落，可用标题和列表辅助排版。"
)

_SYSTEM_PROMPT: str = _SKILL_BODY + _PLAIN_TEXT_OVERRIDE

# -------------------------------------------------------------------


def _build_sse_chunk(
    completion_id: str,
    delta: dict[str, Any],
    finish_reason: str | None = None,
    session_id: str | None = None,
) -> str:
    chunk: dict[str, Any] = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": "agent",
        "choices": [
            {"index": 0, "delta": delta, "finish_reason": finish_reason}
        ],
    }
    if session_id is not None:
        chunk["session_id"] = session_id
    return f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"


class IntelligenceCorrelationAgent(BaseAgent):
    """情报关联分析 Agent — 封装 intelligence-correlation-analysis skill。

    职责：从 messages 提取事件 ID → 直接查 DB 获取事件 →
         用缓存提示词 → 流式调 LLM → 返回纯文本结果。
    """

    @property
    def agent_type(self) -> str:
        return "correlation_analysis"

    def can_handle(self, query: dict[str, Any]) -> bool:
        return query.get("type") == self.agent_type

    # ---- 事件获取 ----

    @staticmethod
    def _extract_event_ids(messages: list[dict[str, str]] | None) -> list[int]:
        if not messages:
            return []
        user_text = " ".join(
            m.get("content", "") for m in messages if m.get("role") == "user"
        )
        if not user_text:
            return []
        ids = re.findall(r"#?(\d{1,6})", user_text)
        seen: set[int] = set()
        result: list[int] = []
        for raw in ids:
            eid = int(raw)
            if eid not in seen:
                seen.add(eid)
                result.append(eid)
        return result

    @staticmethod
    def _fetch_events_from_db(event_ids: list[int], db: Session) -> list[dict[str, Any]]:
        """Fix 1: 直接查 DB，跳过 HTTP 自调用。"""
        from app.models import IntelligenceEvent, RawDocument

        rows = (
            db.query(IntelligenceEvent, RawDocument)
            .outerjoin(RawDocument, IntelligenceEvent.raw_document_id == RawDocument.id)
            .filter(IntelligenceEvent.id.in_(event_ids))
            .all()
        )
        result: list[dict[str, Any]] = []
        for event, raw in rows:
            source_name = (
                (event.extra or {}).get("source_name")
                or (raw.source_name if raw else None)
            )
            published_at = (
                (event.extra or {}).get("published_at")
                or (raw.published_at.isoformat() if raw and raw.published_at else None)
                or (event.created_at.isoformat() if event.created_at else None)
            )
            result.append({
                "event_id": event.id,
                "market": event.market,
                "region": event.region,
                "source_category": event.source_category,
                "env_factors": event.env_factors or [],
                "conduction_chain": event.conduction_chain,
                "signal_direction": event.signal_direction,
                "intensity": event.intensity,
                "impact_scope": event.impact_scope or [],
                "key_claim": event.key_claim,
                "summary": event.summary,
                "confidence": float(event.confidence) if event.confidence is not None else None,
                "source_url": event.source_url,
                "source_name": source_name,
                "published_at": published_at,
                "created_at": event.created_at.isoformat() if event.created_at else None,
            })
        return result

    @staticmethod
    def _map_event_to_item(event: dict[str, Any]) -> dict[str, Any]:
        item: dict[str, Any] = {
            "event_id": str(event.get("event_id")),
            "collected_at": event.get("created_at") or event.get("published_at"),
            "source_category": event.get("source_category"),
            "env_factors": event.get("env_factors", []),
            "impact_scope": event.get("impact_scope", []),
            "signal_direction": event.get("signal_direction"),
            "intensity": event.get("intensity"),
            "confidence": event.get("confidence"),
        }
        if event.get("market"):
            item["market"] = event["market"]
        if event.get("region"):
            item["region"] = event["region"]
        if event.get("key_claim"):
            item["key_claim"] = event["key_claim"]
        if event.get("summary"):
            item["event_summary"] = event["summary"]
        if event.get("conduction_chain"):
            item["conduction_chain"] = event["conduction_chain"]
        if event.get("source_url"):
            item["source_url"] = event["source_url"]
        if event.get("published_at"):
            item["published_at"] = event["published_at"]
        if event.get("source_name"):
            item["source_name"] = event["source_name"]
        return item

    @staticmethod
    def _build_input_data(
        events: list[dict[str, Any]], query: dict[str, Any],
    ) -> dict[str, Any]:
        items = [IntelligenceCorrelationAgent._map_event_to_item(e) for e in events]
        markets = {e.get("market") for e in events if e.get("market")}
        created_ats = [e.get("created_at") for e in events if e.get("created_at")]
        time_window = query.get("time_window")
        if not time_window and created_ats:
            dates_sorted = sorted(created_ats)
            time_window = {"start": dates_sorted[0][:10], "end": dates_sorted[-1][:10]}
        return {
            "batch_meta": {
                "market": query.get("market") or (next(iter(markets)) if markets else "UNKNOWN"),
                "time_window": time_window or {"start": "2026-01-01", "end": "2026-12-31"},
                "item_count": len(items),
            },
            "items": items,
        }

    # ---- 提示词构建 ----

    @staticmethod
    def _build_user_prompt(input_data: dict[str, Any], query: dict[str, Any]) -> str:
        """System prompt 已模块级缓存；user prompt 只含用户指令 + 紧凑 input data。
        input_schema 已在 SKILL.md 中说明，无需重复传递。
        """
        user_parts: list[str] = []
        messages = query.get("messages")
        if messages:
            user_contents = [
                m["content"] for m in messages if m.get("role") == "user" and m.get("content")
            ]
            if user_contents:
                user_parts.append("## 用户指令\n" + "\n".join(user_contents))
        # 紧凑格式减少 token 数量（与 indent=2 相比节省 ~35%）
        user_parts.append(
            "## 输入数据\n" + json.dumps(input_data, ensure_ascii=False, separators=(",", ":"))
        )
        return "\n\n".join(user_parts)

    # ---- 同步执行 ----

    def run(self, query: dict[str, Any], db: Session) -> dict[str, Any]:
        from app.services.llm import get_llm

        event_ids = self._extract_event_ids(query.get("messages"))
        if len(event_ids) < 3:
            raise ValueError(
                f"关联分析至少需要 3 条事件 ID，当前提取到 {len(event_ids)} 条"
            )

        events = self._fetch_events_from_db(event_ids, db)
        if len(events) < 3:
            raise ValueError(
                f"关联分析至少需要 3 条事件，查询到 {len(events)} 条"
            )

        input_data = self._build_input_data(events, query)
        user = self._build_user_prompt(input_data, query)

        logger.info(f"[correlation_agent] running with {len(input_data['items'])} events")
        text = get_llm().chat(system=_SYSTEM_PROMPT, user=user, temperature=0.4)

        return {
            "agent_type": self.agent_type,
            "input_event_count": len(input_data["items"]),
            "content": text,
        }

    # ---- 流式执行 ----

    def stream(self, query: dict[str, Any], db: Session) -> Generator[str, None, None]:
        from app.services.llm import get_llm

        # 1. 提取事件 ID
        event_ids = self._extract_event_ids(query.get("messages"))
        if len(event_ids) < 3:
            error = f"关联分析至少需要 3 条事件 ID，当前提取到 {len(event_ids)} 条"
            yield _build_sse_chunk(
                "agent-error",
                {"content": json.dumps({"error": error}, ensure_ascii=False)},
                finish_reason="stop",
            )
            yield "data: [DONE]\n\n"
            return

        # 2. 直接查 DB（Fix 1）
        try:
            events = self._fetch_events_from_db(event_ids, db)
        except Exception as exc:
            error = f"获取事件数据失败: {exc}"
            yield _build_sse_chunk(
                "agent-error",
                {"content": json.dumps({"error": error}, ensure_ascii=False)},
                finish_reason="stop",
            )
            yield "data: [DONE]\n\n"
            return

        if len(events) < 3:
            error = f"关联分析至少需要 3 条事件，查询到 {len(events)} 条"
            yield _build_sse_chunk(
                "agent-error",
                {"content": json.dumps({"error": error}, ensure_ascii=False)},
                finish_reason="stop",
            )
            yield "data: [DONE]\n\n"
            return

        # 3. 构造 user prompt（system prompt 已模块级缓存，Fix 2+3）
        input_data = self._build_input_data(events, query)
        user = self._build_user_prompt(input_data, query)

        completion_id = f"agent-{uuid.uuid4().hex[:12]}"
        yield _build_sse_chunk(completion_id, {"role": "assistant"})

        n = len(input_data["items"])
        sys_tokens_est = len(_SYSTEM_PROMPT) // 4
        user_tokens_est = len(user) // 4
        logger.info(
            f"[correlation_agent] streaming {n} events | "
            f"prompt≈{sys_tokens_est + user_tokens_est} tokens "
            f"(sys≈{sys_tokens_est}, user≈{user_tokens_est})"
        )
        t0 = time.perf_counter()
        llm = get_llm()
        first = True
        for token in llm.chat_stream(system=_SYSTEM_PROMPT, user=user, temperature=0.4, enable_thinking=False):
            if first:
                logger.info(f"[correlation_agent] TTFT={time.perf_counter() - t0:.2f}s")
                first = False
            yield _build_sse_chunk(completion_id, {"content": token})

        yield _build_sse_chunk(completion_id, {}, finish_reason="stop")
        yield "data: [DONE]\n\n"
