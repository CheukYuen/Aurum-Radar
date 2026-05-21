"""Stage 7 — Action: turn high-priority events into department action items.

LLM + department templates (PRD §9.7). Output -> action_items (§8).
"""
from __future__ import annotations

from loguru import logger

from app.schemas import ActionItemIn, ActionStatus, IntelligenceEventIn, Priority
from app.services.llm import get_llm
from app.services.taxonomy import EVENT_TYPE_DEPARTMENTS


def generate_actions(events: list[IntelligenceEventIn]) -> list[ActionItemIn]:
    """Generate department action items from P0 / P1 events."""
    high_priority = [e for e in events if e.priority in (Priority.P0, Priority.P1)]
    if not high_priority:
        logger.info("Action: no high-priority events")
        return []

    llm = get_llm()
    if not llm.is_configured:
        # TODO: requires DASHSCOPE_API_KEY. Without it, no actions are generated.
        logger.warning("LLM not configured — action stage produces 0 items")
        return []

    actions: list[ActionItemIn] = []
    try:
        raw = llm.generate_actions(events=[_event_brief(e) for e in high_priority])
        for item in raw.get("actions", []):
            action = _validate_action(item)
            if action is not None:
                actions.append(action)
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Action generation failed: {exc}")

    logger.info(
        f"Action: {len(high_priority)} events -> {len(actions)} action items"
    )
    return actions


def _validate_action(item: dict) -> ActionItemIn | None:
    try:
        return ActionItemIn(
            market=item["market"],
            department=item["department"],
            priority=Priority(item.get("priority", "P1")),
            action_title=item["action_title"],
            action_detail=item["action_detail"],
            reason=item.get("reason", ""),
            deadline=item.get("deadline"),
            expected_output=item.get("expected_output"),
            success_metric=item.get("success_metric"),
            status=ActionStatus.pending,
            # TODO: set event_id once events are persisted and have ids
        )
    except (KeyError, ValueError) as exc:
        logger.error(f"Invalid LLM action JSON ({exc})")
        return None


def _event_brief(e: IntelligenceEventIn) -> dict:
    return {
        "market": e.market,
        "event_type": e.event_type.value,
        "title": e.title,
        "summary": e.summary,
        "business_impact": e.business_impact,
        "impact_type": e.impact_type.value,
        "priority": e.priority.value,
        # hint: departments most likely to own follow-up (PRD §9.7)
        "suggested_departments": EVENT_TYPE_DEPARTMENTS.get(e.event_type, []),
    }
