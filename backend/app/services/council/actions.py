"""Derive action_items from the council decision report (architecture.md §17.7).

department_actions has five fixed team sections, but a section may be empty —
a team produces action_items only when it has an action. No per-department
filler. Each council action is a rich object (action / detail / rationale /
expected_output / success_metric) so the derived action_items columns stay
distinct — title, detail and reason must not collapse into the same text.
"""
from __future__ import annotations

from app.schemas import ActionItemIn, Priority

# output_schema.json department_actions key -> action_items.department
_TEAM_DEPARTMENT = {
    "product_team": "商品团队",
    "marketing_team": "市场营销团队",
    "channel_team": "渠道团队",
    "management": "管理层",
    "risk_team": "法务合规团队",
}

# priority -> deadline phrasing (output_schema: P0=本周内 / P1=本月内 / P2=本季度)
_DEADLINE = {"P0": "本周内", "P1": "本月内", "P2": "本季度"}


def _priority(value) -> Priority:
    try:
        return Priority(str(value))
    except ValueError:
        return Priority.P1


def _fallback_reason(item: dict) -> str:
    """Per-action reason when the LLM omitted `rationale`.

    Built from this action's own evidence/category — never the global
    council_summary, so reasons stay distinct across actions.
    """
    bits: list[str] = []
    if item.get("category"):
        bits.append(f"品类 {item['category']}")
    if item.get("channel"):
        bits.append(f"渠道 {item['channel']}")
    evidence = item.get("evidence_ids") or []
    if evidence:
        bits.append(f"证据 {', '.join(str(e) for e in evidence)}")
    return "；".join(bits) or "智囊团决策派生行动"


def derive_actions(market: str, report: dict) -> list[ActionItemIn]:
    """Turn the report's department_actions into ActionItemIn rows."""
    dept_actions = report.get("department_actions") or {}
    actions: list[ActionItemIn] = []
    for team_key, items in dept_actions.items():
        if not isinstance(items, list):
            continue
        department = _TEAM_DEPARTMENT.get(team_key, team_key)
        for item in items:
            if not isinstance(item, dict):
                continue
            action = item.get("action")
            if not action:
                continue
            priority = _priority(item.get("priority", "P1"))
            detail = item.get("detail") or action
            rationale = item.get("rationale") or _fallback_reason(item)
            actions.append(ActionItemIn(
                market=item.get("market") or market,
                department=department,
                priority=priority,
                action_title=str(action)[:80],
                action_detail=str(detail),
                reason=str(rationale),
                deadline=_DEADLINE.get(priority.value),
                expected_output=item.get("expected_output"),
                success_metric=item.get("success_metric"),
                extra={
                    "evidence_ids": item.get("evidence_ids", []),
                    "category": item.get("category"),
                    "channel": item.get("channel"),
                },
            ))
    return actions
