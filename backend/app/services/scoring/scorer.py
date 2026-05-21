"""Stage 4 — Score: rule-based opportunity / risk scoring.

Rules-first (architecture.md §7.2 / PRD §15.3) so scores stay stable,
explainable and comparable across markets. Pure logic — no LLM.
"""
from __future__ import annotations

from datetime import datetime, timezone

from loguru import logger

from app.schemas import CredibilityLevel, ImpactType, IntelligenceEventIn
from app.services.taxonomy import (
    CREDIBILITY_MULTIPLIER,
    EVENT_TYPE_BASE_SCORE,
    PRIORITY_ADJUSTMENT,
)


def score_events(events: list[IntelligenceEventIn]) -> list[IntelligenceEventIn]:
    """Fill opportunity_score / risk_score on each event in place."""
    for event in events:
        opp, risk = _score_one(event)
        event.opportunity_score = opp
        event.risk_score = risk
    logger.info(f"Score: {len(events)} events scored")
    return events


def _score_one(event: IntelligenceEventIn) -> tuple[int, int]:
    base_opp, base_risk = EVENT_TYPE_BASE_SCORE.get(event.event_type, (50, 50))

    # impact direction shifts the dominant dimension
    if event.impact_type == ImpactType.opportunity:
        base_opp += 20
        base_risk -= 10
    elif event.impact_type == ImpactType.risk:
        base_risk += 25
        base_opp -= 10
    # watch: leave the base values unchanged

    # priority adjusts the dominant dimension
    adj = PRIORITY_ADJUSTMENT.get(event.priority, 0)
    if base_opp >= base_risk:
        base_opp += adj
    else:
        base_risk += adj

    # a weak source / stale signal yields a weaker score
    mult = CREDIBILITY_MULTIPLIER.get(
        event.credibility_level or CredibilityLevel.B, 0.78
    )
    recency = _recency_factor(event.published_at)

    opp = _clamp(base_opp * mult * recency)
    risk = _clamp(base_risk * mult * recency)
    return opp, risk


def _recency_factor(published_at: datetime | None) -> float:
    if published_at is None:
        return 0.85  # unknown date — mild discount
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    days = (now - published_at).days
    if days <= 3:
        return 1.0
    if days <= 7:
        return 0.9
    if days <= 30:
        return 0.75
    return 0.6


def _clamp(value: float) -> int:
    return max(0, min(100, round(value)))
