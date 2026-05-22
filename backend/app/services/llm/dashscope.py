"""DashScope (Qwen) LLM provider — OpenAI-compatible interface.

Used by stages 3 / 5 / 6 / 7. See architecture.md §12.
All methods return parsed JSON dicts; callers validate against the schema.
"""
from __future__ import annotations

import json
import time
from typing import Any

from loguru import logger
from openai import OpenAI

from app.core.config import settings

# bounded retry with backoff (architecture.md §12)
_MAX_RETRIES = 2
_BACKOFF_SECONDS = 2.0


class DashScopeLLM:
    """Thin wrapper over the DashScope OpenAI-compatible endpoint."""

    def __init__(self) -> None:
        self._client: OpenAI | None = None

    @property
    def is_configured(self) -> bool:
        return bool(settings.DASHSCOPE_API_KEY)

    @property
    def client(self) -> OpenAI:
        if not self.is_configured:
            raise RuntimeError(
                "DASHSCOPE_API_KEY is not set — cannot call the LLM. "
                "Set it in backend/.env (see architecture.md appendix B)."
            )
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.DASHSCOPE_API_KEY,
                base_url=settings.DASHSCOPE_BASE_URL,
            )
        return self._client

    # ---- low-level JSON chat call -----------------------------------------
    def _chat_json(
        self, model: str, system: str, user: str, temperature: float = 0.3
    ) -> dict[str, Any]:
        last_err: Exception | None = None
        for attempt in range(_MAX_RETRIES + 1):
            try:
                resp = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    temperature=temperature,
                    response_format={"type": "json_object"},
                )
                content = resp.choices[0].message.content or "{}"
                return json.loads(content)
            except Exception as exc:  # noqa: BLE001 - surface only after retries
                last_err = exc
                logger.warning(f"LLM call failed (attempt {attempt + 1}): {exc}")
                if attempt < _MAX_RETRIES:
                    time.sleep(_BACKOFF_SECONDS * (attempt + 1))
        raise RuntimeError(f"LLM call failed after retries: {last_err}")

    def chat_json(
        self,
        *,
        system: str,
        user: str,
        model: str | None = None,
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """Generic JSON chat. Defaults to the standard model (qwen-plus) for
        reliable structured output; callers pass ``model`` to pick another tier
        (architecture.md §12). Used by the strategy sandbox and evaluation agent.
        """
        return self._chat_json(
            model or settings.DASHSCOPE_MODEL_SUMMARY, system, user, temperature
        )

    # ---- stage 3: event extraction ----------------------------------------
    def extract_event(
        self,
        *,
        title: str,
        body: str,
        market: str,
        source_name: str,
        candidate_event_type: str | None,
    ) -> dict:
        """Extract one structured event from a document. architecture.md §12."""
        # TODO: tune this prompt against real extraction quality.
        system = (
            "你是周大福海外市场战略情报分析师。从给定的公开信息中抽取一条结构化"
            "市场事件，严格输出 JSON。判断重点：这条信息对周大福珠宝业务"
            "意味着什么（机会 / 风险 / 需关注）。"
        )
        user = f"""市场：{market}
来源：{source_name}
候选事件类型（仅供参考，可修正）：{candidate_event_type or "未知"}
标题：{title}
正文：{body or "（无正文，仅标题可用）"}

判级标准（务必遵守，不要滥用 P0）：
- priority：P0 仅限重大法规变化 / 重大负面舆情 / 平台重大政策，需 24-48 小时内跟进；
  竞品动作、产品趋势、节庆与渠道机会一律用 P1；信号弱或单一来源用 P2。
- confidence：取决于来源权威性与信息明确度，多源印证才给 high，单一来源最多 medium。

请输出 JSON，字段如下：
{{
  "event_type": "competition|product|platform|social|regulation|pricing|channel|festival",
  "title": "简洁的中文事件标题",
  "summary": "2-3 句中文事件摘要",
  "business_impact": "对周大福的业务影响判断（这意味着什么）",
  "impact_type": "opportunity|risk|watch",
  "priority": "P0|P1|P2",
  "confidence": "high|medium|low"
}}"""
        return self._chat_json(settings.DASHSCOPE_MODEL_EXTRACT, system, user, 0.3)

    # ---- stage 5: market forecast -----------------------------------------
    def forecast_market(self, *, market: str, events: list[dict]) -> dict:
        """Aggregate a market's events into a country-level judgement."""
        # TODO: tune prompt; watch the token budget when events is large.
        system = (
            "你是周大福海外市场战略情报分析师。基于当日某市场的多条事件，"
            "给出该市场的综合研判，严格输出 JSON。"
        )
        user = f"""市场：{market}
当日事件列表（JSON）：
{json.dumps(events, ensure_ascii=False, indent=2)}

请输出 JSON：
{{
  "overall_judgement": "该市场综合判断，3-5 句中文",
  "key_opportunities": ["机会要点", "..."],
  "key_risks": ["风险要点", "..."],
  "watch_items": ["需关注事项", "..."]
}}"""
        return self._chat_json(settings.DASHSCOPE_MODEL_SUMMARY, system, user, 0.4)

    # ---- stage 6: daily brief ---------------------------------------------
    def generate_brief(self, *, snapshots: list[dict], events: list[dict]) -> dict:
        """Generate the daily strategic brief. PRD §9.6 — headline deliverable."""
        # TODO: tune prompt; this output is what judges read first.
        system = (
            "你是周大福海外市场战略情报分析师。基于各市场研判与重点事件，"
            "生成面向管理层的每日战略简报，严格输出 JSON。"
        )
        user = f"""市场研判（JSON）：
{json.dumps(snapshots, ensure_ascii=False, indent=2)}

重点事件（JSON）：
{json.dumps(events, ensure_ascii=False, indent=2)}

请输出 JSON：
{{
  "executive_summary": "全球业务影响综合研判，1 段中文",
  "opportunities": ["今日机会", "..."],
  "risks": ["今日风险", "..."],
  "watch_items": ["需关注事项", "..."]
}}"""
        return self._chat_json(settings.DASHSCOPE_MODEL_SUMMARY, system, user, 0.4)

    # ---- stage 7: department actions --------------------------------------
    def generate_actions(self, *, events: list[dict]) -> dict:
        """Turn high-priority events into department action items. PRD §9.7."""
        # TODO: tune prompt; keep departments aligned with taxonomy.DEPARTMENTS.
        system = (
            "你是周大福海外市场战略情报分析师。把高优先级事件拆解为"
            "部门可执行的行动任务，严格输出 JSON。"
        )
        user = f"""高优先级事件（JSON）：
{json.dumps(events, ensure_ascii=False, indent=2)}

请输出 JSON：
{{
  "actions": [
    {{
      "market": "市场",
      "department": "负责部门",
      "priority": "P0|P1|P2",
      "action_title": "任务标题",
      "action_detail": "任务详情",
      "reason": "触发原因",
      "deadline": "建议时限，如 '3 个工作日内'",
      "expected_output": "预期产出",
      "success_metric": "成功指标"
    }}
  ]
}}"""
        return self._chat_json(settings.DASHSCOPE_MODEL_ACTION, system, user, 0.4)


_llm: DashScopeLLM | None = None


def get_llm() -> DashScopeLLM:
    """Module-level singleton accessor."""
    global _llm
    if _llm is None:
        _llm = DashScopeLLM()
    return _llm
