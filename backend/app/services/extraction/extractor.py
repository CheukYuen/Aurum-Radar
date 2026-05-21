"""Stage 3 — Extract: raw documents -> structured intelligence events.

Flow: rule pre-classification -> DashScope LLM extraction -> JSON validation.
One document yields at most one event (1:1, architecture.md §8).
architecture.md §7.3 / §12.
"""
from __future__ import annotations

from loguru import logger

from app.schemas import (
    Confidence,
    EventType,
    ImpactType,
    IntelligenceEventIn,
    Priority,
    RawDocumentIn,
)
from app.services.extraction.classify import classify_document
from app.services.llm import get_llm


def extract_events(docs: list[RawDocumentIn]) -> list[IntelligenceEventIn]:
    """Extract one structured event per relevant document."""
    llm = get_llm()
    if not llm.is_configured:
        # TODO: requires DASHSCOPE_API_KEY. Without it, extraction is skipped.
        logger.warning("LLM not configured — extract stage produces 0 events")
        return []

    events: list[IntelligenceEventIn] = []
    for doc in docs:
        candidate = classify_document(doc)
        doc.candidate_event_type = candidate
        try:
            raw = llm.extract_event(
                title=doc.title,
                body=doc.clean_content or "",
                market=doc.market,
                source_name=doc.source_name,
                candidate_event_type=candidate.value if candidate else None,
            )
            event = _validate_event(raw, doc)
            if event is not None:
                events.append(event)
        except Exception as exc:  # noqa: BLE001 - one bad doc must not abort the batch
            logger.error(f"Extraction failed for {doc.url}: {exc}")

    logger.info(f"Extract: {len(docs)} docs -> {len(events)} events")
    return events


def _validate_event(raw: dict, doc: RawDocumentIn) -> IntelligenceEventIn | None:
    """Validate the LLM JSON against the contract; drop on hard failure."""
    try:
        return IntelligenceEventIn(
            market=doc.market,
            region=doc.region,
            event_type=EventType(raw["event_type"]),
            title=raw["title"],
            summary=raw["summary"],
            business_impact=raw["business_impact"],
            impact_type=ImpactType(raw["impact_type"]),
            priority=Priority(raw["priority"]),
            confidence=Confidence(raw["confidence"]),
            # opportunity_score / risk_score are filled by the scoring stage
            source_url=doc.url,
            source_name=doc.source_name,
            credibility_level=doc.credibility_level,
            published_at=doc.published_at,
            # TODO: set raw_document_id once docs are persisted and have ids
        )
    except (KeyError, ValueError) as exc:
        logger.error(f"Invalid LLM event JSON ({exc}) for {doc.url}")
        return None
