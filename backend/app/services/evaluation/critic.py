"""LLM critic for the evaluation agent — evidence grounding & logic review.

Model tiering (architecture.md §12): per-event grounding is a light, repetitive
task → qwen-flash; the holistic strategy logic review is complex → qwen-max.
"""
from __future__ import annotations

import json

from loguru import logger

from app.core.config import settings
from app.services.llm import get_llm

_SYS = "你是周大福战略情报的质量审查员，严格、挑剔，只输出 JSON。"


def critique_event(event: dict, source_excerpt: str) -> dict:
    """Per-event grounding & credibility check — light task (qwen-flash)."""
    user = f"""事件（Agent 抽取的结果）：
{json.dumps(event, ensure_ascii=False, indent=2)}

来源原文节选：
{(source_excerpt or "（无正文）")[:1500]}

审查：
1. business_impact 是否能从原文与摘要合理推出？有无夸大或无依据的臆测？
2. 该事件来源可信度为 {event.get('credibility_level', 'unknown')}，
   其 confidence / priority 是否与来源可信度匹配（低可信来源不应给高确信）？
输出 JSON：
{{"verdict": "grounded|overstated|unsupported",
  "credibility_ok": true,
  "issue": "若有问题简述，没有则空字符串"}}"""
    try:
        return get_llm().chat_json(
            system=_SYS, user=user,
            model=settings.DASHSCOPE_MODEL_LIGHT, temperature=0.2,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"event critique failed: {exc}")
        return {"verdict": "unknown", "credibility_ok": None, "issue": str(exc)[:80]}


def critique_strategy(strategy_result: dict) -> dict:
    """Holistic logic review of the strategy sandbox — complex task (qwen-max)."""
    payload = {
        "situation_summary": strategy_result.get("situation_summary"),
        "strategic_variables": strategy_result.get("strategic_variables"),
        "matched_strategies": [
            {"strategy_name": m.get("strategy_name"), "match_score": m.get("match_score")}
            for m in strategy_result.get("matched_strategies", [])
        ],
        "ranked_plans": [
            {"plan_name": p.get("plan_name"), "rank": p.get("rank"),
             "weighted_score": p.get("weighted_score")}
            for p in strategy_result.get("ranked_plans", [])
        ],
        "three_strategies": strategy_result.get("three_strategies"),
    }
    user = f"""战略沙盘推演结果：
{json.dumps(payload, ensure_ascii=False, indent=2)}

审查推演的逻辑链是否自洽：
1. 战略变量是否由情报支撑，有无与情报矛盾的变量判断？
2. 匹配到的策略是否真的契合变量？
3. 上中下三策是否与排序结果一致？三策之间有无矛盾？
4. 行动路径是否具体、可验证，还是泛泛而谈？
输出 JSON：
{{"logic_verdict": "sound|minor_issues|flawed",
  "issues": ["..."],
  "strengths": ["..."]}}"""
    try:
        return get_llm().chat_json(
            system=_SYS, user=user,
            model=settings.DASHSCOPE_MODEL_REASONING, temperature=0.3,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"strategy critique failed: {exc}")
        return {"logic_verdict": "unknown", "issues": [str(exc)[:80]], "strengths": []}
