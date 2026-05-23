from __future__ import annotations

import json
import time
import uuid
from collections.abc import Generator
from typing import Any

from loguru import logger
from sqlalchemy.orm import Session

from app.agents.base import BaseAgent

_SYSTEM_PROMPT = """\
你是 Aurum Radar 的战略情报助理，服务于周大福珠宝品牌的海外市场战略决策团队。
用户在前端 Chat 抽屉中提问，消息开头可能包含"【今日战略简报】""【…市场判断】"\
"【高优先级事件】""【部门行动建议】"等上下文片段，请优先依据这些内容回答。
回答风格：直接给结论 → 关键依据（必要时引用上下文中的 #事件ID 或 action#ID）→ 建议下一步。
纯文本输出，可用短列表，不要 JSON、代码块或 markdown 标题。
若上下文未覆盖问题，明确说明"当前上下文未涵盖"并给出可追问的方向。\
"""


def _sse_chunk(
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
        "choices": [{"index": 0, "delta": delta, "finish_reason": finish_reason}],
    }
    if session_id is not None:
        chunk["session_id"] = session_id
    return f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"


class GeneralChatAgent(BaseAgent):
    """通用多轮对话 Agent — 接受完整 messages 历史，注入 system prompt 后流式调 LLM。

    走 POST /api/agents/stream（type=general_chat）路由。
    """

    @property
    def agent_type(self) -> str:
        return "general_chat"

    def can_handle(self, query: dict[str, Any]) -> bool:
        return query.get("type") == self.agent_type

    def run(self, query: dict[str, Any], db: Session) -> dict[str, Any]:
        from app.services.llm import get_llm

        messages = self._build_messages(query)
        text = get_llm().chat(
            system=_SYSTEM_PROMPT,
            user=self._last_user_content(query),
            temperature=0.4,
        )
        return {"agent_type": self.agent_type, "content": text}

    def stream(self, query: dict[str, Any], db: Session) -> Generator[str, None, None]:
        from app.services.llm import get_llm

        messages = self._build_messages(query)
        completion_id = f"agent-{uuid.uuid4().hex[:12]}"

        logger.info(f"[general_chat] streaming, turns={len(messages)}")

        yield _sse_chunk(completion_id, {"role": "assistant"})

        for token in get_llm().chat_stream_messages(messages=messages, temperature=0.4):
            yield _sse_chunk(completion_id, {"content": token})

        yield _sse_chunk(completion_id, {}, finish_reason="stop")
        yield "data: [DONE]\n\n"

    # ── helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _build_messages(query: dict[str, Any]) -> list[dict[str, str]]:
        """将前端传来的 messages 数组 prepend system prompt。"""
        raw = query.get("messages", [])
        if isinstance(raw, str):
            raw = [{"role": "user", "content": raw}]

        # 过滤掉非 user/assistant 角色（前端可能误传 system）
        history = [m for m in raw if m.get("role") in ("user", "assistant")]
        return [{"role": "system", "content": _SYSTEM_PROMPT}, *history]

    @staticmethod
    def _last_user_content(query: dict[str, Any]) -> str:
        raw = query.get("messages", [])
        if isinstance(raw, str):
            return raw
        for m in reversed(raw):
            if m.get("role") == "user":
                return m.get("content", "")
        return ""
