"""Stage 6 — Brief: generate the daily strategic brief.

The headline deliverable (PRD §9.6). Output -> daily_briefs (§8).
``recommended_actions`` is filled afterwards by stage 7 (see pipeline.py).
"""
from __future__ import annotations

from datetime import date

from loguru import logger

from app.schemas import DailyBriefIn, IntelligenceEventIn, MarketSnapshotIn
from app.services.llm import get_llm


def generate_brief(
    events: list[IntelligenceEventIn],
    snapshots: list[MarketSnapshotIn],
    brief_date: date | None = None,
    source_count: int = 0,
) -> DailyBriefIn:
    """Produce one DailyBriefIn for the given day."""
    brief_date = brief_date or date.today()
    brief = DailyBriefIn(
        brief_date=brief_date,
        markets=sorted({s.market for s in snapshots}),
        event_count=len(events),
        source_count=source_count,
    )

    llm = get_llm()
    if llm.is_configured:
        try:
            raw = llm.generate_brief(
                snapshots=[_snapshot_brief(s) for s in snapshots],
                events=[_event_brief(e) for e in _top_events(events)],
            )
            brief.executive_summary = raw.get("executive_summary", "")
            brief.opportunities = raw.get("opportunities", [])
            brief.risks = raw.get("risks", [])
            brief.watch_items = raw.get("watch_items", [])
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Brief generation failed: {exc}")
    else:
        # TODO: requires DASHSCOPE_API_KEY for the executive summary.
        logger.warning("LLM not configured — brief has counts only")

    logger.info(f"Brief: generated for {brief_date} ({len(events)} events)")
    return brief


def _top_events(
    events: list[IntelligenceEventIn], limit: int = 20
) -> list[IntelligenceEventIn]:
    """Highlight the strongest signals — ranked by max(opportunity, risk)."""
    return sorted(
        events, key=lambda e: max(e.opportunity_score, e.risk_score), reverse=True
    )[:limit]


def _snapshot_brief(s: MarketSnapshotIn) -> dict:
    return {
        "market": s.market,
        "opportunity_score": s.opportunity_score,
        "risk_score": s.risk_score,
        "overall_judgement": s.overall_judgement,
    }


def _event_brief(e: IntelligenceEventIn) -> dict:
    return {
        "market": e.market,
        "event_type": e.event_type.value,
        "title": e.title,
        "impact_type": e.impact_type.value,
        "priority": e.priority.value,
    }
