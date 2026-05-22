"""Stage 5 — Forecast: aggregate a market's events into a daily judgement.

Rule-computed scores + LLM narrative judgement. Output -> market_snapshots (§8).
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date

from loguru import logger

from app.schemas import IntelligenceEventIn, MarketSnapshotIn
from app.services.llm import get_llm
from app.services.taxonomy import region_for


def forecast_markets(
    events: list[IntelligenceEventIn],
    snapshot_date: date | None = None,
) -> list[MarketSnapshotIn]:
    """Produce one MarketSnapshotIn per market present in ``events``."""
    snapshot_date = snapshot_date or date.today()
    by_market: dict[str, list[IntelligenceEventIn]] = defaultdict(list)
    for ev in events:
        by_market[ev.market].append(ev)

    llm = get_llm()
    snapshots: list[MarketSnapshotIn] = []
    for market, market_events in by_market.items():
        opp, risk = _aggregate_scores(market_events)
        snapshot = MarketSnapshotIn(
            market=market,
            region=region_for(market),
            snapshot_date=snapshot_date,
            opportunity_score=opp,
            risk_score=risk,
            event_count=len(market_events),
        )
        if llm.is_configured:
            try:
                raw = llm.forecast_market(
                    market=market,
                    events=[_event_brief(e) for e in market_events],
                )
                snapshot.overall_judgement = raw.get("overall_judgement", "")
                snapshot.key_opportunities = raw.get("key_opportunities", [])
                snapshot.key_risks = raw.get("key_risks", [])
                snapshot.watch_items = raw.get("watch_items", [])
            except Exception as exc:  # noqa: BLE001
                logger.error(f"Forecast failed for {market}: {exc}")
        else:
            # TODO: requires DASHSCOPE_API_KEY for the narrative judgement.
            logger.warning(f"LLM not configured — {market} snapshot has scores only")
        snapshots.append(snapshot)

    logger.info(f"Forecast: {len(snapshots)} market snapshots")
    return snapshots


def _aggregate_scores(events: list[IntelligenceEventIn]) -> tuple[int, int]:
    """Market score = average of its events' scores (rule-based)."""
    if not events:
        return 0, 0
    opp = round(sum(e.opportunity_score for e in events) / len(events))
    risk = round(sum(e.risk_score for e in events) / len(events))
    return opp, risk


def _event_brief(e: IntelligenceEventIn) -> dict:
    return {
        "event_type": e.event_type.value,
        "title": e.title,
        "summary": e.summary,
        "business_impact": e.business_impact,
        "impact_type": e.impact_type.value,
        "priority": e.priority.value,
        "opportunity_score": e.opportunity_score,
        "risk_score": e.risk_score,
    }
