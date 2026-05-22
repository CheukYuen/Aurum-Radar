"""Input adapter — intelligence_events → intelligence_batch (architecture.md §17.5).

Aggregates one market's persisted intelligence_events into the
``intelligence_batch`` shape the council skill's input_schema.json expects.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import IntelligenceEvent, MarketSnapshot, RawDocument

# event_type -> input_schema.json category enum
_CATEGORY_MAP = {
    "competition": "competition",
    "product": "product",
    "platform": "channel",
    "social": "social",
    "regulation": "regulation",
    "pricing": "price",
    "channel": "channel",
    "festival": "consumer",
}

# raw_documents.source_type -> input_schema.json source_type enum
_SOURCE_TYPE_MAP = {
    "news": "news",
    "competitor": "brand_official",
    "platform": "ecommerce",
    "regulation": "regulator",
    "market_data": "report",
    "mall": "other",
    "social": "social",
    "report": "report",
}

_IMPACT_SENTIMENT = {"opportunity": "positive", "risk": "negative", "watch": "neutral"}
_CONFIDENCE_NUM = {"high": 0.85, "medium": 0.6, "low": 0.4}

# input_schema source_type values that count as first-party (architecture.md §17.8)
PRIMARY_SOURCES = {"regulator", "brand_official", "report"}

_IMPACT_AREA = {
    "competition": ["brand", "channel"],
    "product": ["product"],
    "platform": ["channel"],
    "social": ["marketing", "brand"],
    "regulation": ["compliance"],
    "pricing": ["pricing", "supply"],
    "channel": ["channel"],
    "festival": ["marketing"],
}


def build_batch(db: Session, market: str) -> dict:
    """Aggregate one market's intelligence_events into an intelligence_batch."""
    events = (
        db.query(IntelligenceEvent)
        .filter(IntelligenceEvent.market == market)
        .order_by(IntelligenceEvent.id)
        .all()
    )
    raw_ids = [e.raw_document_id for e in events if e.raw_document_id]
    raw_map: dict[int, RawDocument] = {}
    if raw_ids:
        rows = db.query(RawDocument).filter(RawDocument.id.in_(raw_ids)).all()
        raw_map = {r.id: r for r in rows}

    items: list[dict] = []
    published: list[datetime] = []
    for e in events:
        extra = e.extra or {}
        raw = raw_map.get(e.raw_document_id)
        pub = raw.published_at if raw else None
        if pub:
            published.append(pub)
        excerpt = ""
        if raw:
            excerpt = (raw.clean_content or raw.raw_content or "")[:200]
        if not excerpt:
            excerpt = (e.summary or "")[:200]
        items.append({
            "id": str(e.id),
            "market": e.market,
            "region": e.region or "",
            "source_type": _SOURCE_TYPE_MAP.get(raw.source_type, "other") if raw else "other",
            "source_name": (raw.source_name if raw else None) or extra.get("source_name") or "",
            "source_url": e.source_url or "",
            "published_at": pub.date().isoformat() if pub else "",
            "category": _CATEGORY_MAP.get(e.event_type, "macro"),
            "event_summary": e.summary or e.title or "",
            "raw_excerpt": excerpt,
            "sentiment": _IMPACT_SENTIMENT.get(e.impact_type, "neutral"),
            "impact_area": _IMPACT_AREA.get(e.event_type, []),
            "confidence": _CONFIDENCE_NUM.get(e.confidence, 0.5),
            "tags": [t for t in (e.event_type, e.impact_type) if t],
        })

    time_window = ""
    if published:
        lo, hi = min(published).date(), max(published).date()
        time_window = f"{lo.isoformat()}/{hi.isoformat()}"

    return {
        "batch_meta": {
            "market": market,
            "region": (events[0].region if events else "") or "",
            "time_window": time_window,
            "item_count": len(items),
        },
        "items": items,
    }


def market_snapshot_context(db: Session, market: str) -> dict:
    """Latest market_snapshot as background context for the council (§17.5)."""
    snapshot = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.market == market)
        .order_by(MarketSnapshot.id.desc())
        .first()
    )
    if snapshot is None:
        return {}
    return {
        "opportunity_score": snapshot.opportunity_score,
        "risk_score": snapshot.risk_score,
        "overall_judgement": snapshot.overall_judgement,
        "key_opportunities": snapshot.key_opportunities,
        "key_risks": snapshot.key_risks,
        "watch_items": snapshot.watch_items,
    }


def primary_source_ratio(batch: dict) -> float:
    """Share of items from first-party sources — fed to the synthesis step."""
    items = batch.get("items", [])
    if not items:
        return 0.0
    primary = sum(1 for it in items if it.get("source_type") in PRIMARY_SOURCES)
    return round(primary / len(items), 3)
