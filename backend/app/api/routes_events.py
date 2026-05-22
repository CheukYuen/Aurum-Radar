from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import IntelligenceEvent, RawDocument

router = APIRouter()

CATEGORY_TO_EVENT_TYPE = {
    "竞争": "competition",
    "产品": "product",
    "平台": "platform",
    "社媒": "social",
    "法规": "regulation",
    "渠道": "channel",
}

EVENT_TYPE_TO_CATEGORY = {v: k for k, v in CATEGORY_TO_EVENT_TYPE.items()}
EVENT_TYPE_TO_CATEGORY.update({"pricing": "产品", "festival": "产品"})


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _event_type_from_category(category: str | None) -> str | None:
    if not category or category == "全部":
        return None
    return CATEGORY_TO_EVENT_TYPE.get(category, category)


def _priority_to_ui(priority: str | None) -> str:
    return "high" if priority in {"P0", "P1", "high"} else "mid"


def _serialize_event(event: IntelligenceEvent, raw: RawDocument | None = None) -> dict:
    source_name = (
        (event.extra or {}).get("source_name")
        or (raw.source_name if raw else None)
        or "公开来源"
    )
    published_at = (
        (event.extra or {}).get("published_at")
        or _iso(raw.published_at if raw else None)
        or _iso(event.created_at)
    )
    category = EVENT_TYPE_TO_CATEGORY.get(event.event_type or "", event.event_type or "")
    return {
        # architecture.md §6.3 fields
        "event_id": event.id,
        "market": event.market,
        "region": event.region,
        "event_type": event.event_type,
        "title": event.title,
        "summary": event.summary,
        "business_impact": event.business_impact,
        "impact_type": event.impact_type,
        "priority": event.priority,
        "confidence": event.confidence,
        "opportunity_score": event.opportunity_score,
        "risk_score": event.risk_score,
        "source_url": event.source_url,
        "published_at": published_at,
        "created_at": _iso(event.created_at),
        "updated_at": _iso(event.updated_at),
        # compatibility fields for the current React view model
        "cat": category,
        "source_name": source_name,
        "source": source_name,
        "src_detail": event.source_url,
        "time": published_at,
        "impact": [
            {
                "kind": "trend",
                "title": "业务影响",
                "text": event.business_impact or event.summary or "",
            }
        ],
        "markets": [event.market] if event.market else [],
        "brands": [source_name] if source_name else [],
        "citation": source_name,
        "citation_time": published_at,
        "new": False,
        "ui_priority": _priority_to_ui(event.priority),
    }


@router.get("/events")
def list_events(
    category: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    impact_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = (
        db.query(IntelligenceEvent, RawDocument)
        .outerjoin(RawDocument, IntelligenceEvent.raw_document_id == RawDocument.id)
    )
    if market:
        q = q.filter(IntelligenceEvent.market == market)
    resolved_event_type = event_type or _event_type_from_category(category)
    if resolved_event_type:
        q = q.filter(IntelligenceEvent.event_type == resolved_event_type)
    if priority:
        q = q.filter(IntelligenceEvent.priority == priority)
    if impact_type:
        q = q.filter(IntelligenceEvent.impact_type == impact_type)

    total = q.count()
    rows = (
        q.order_by(IntelligenceEvent.created_at.desc(), IntelligenceEvent.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return {
        "items": [_serialize_event(event, raw) for event, raw in rows],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(IntelligenceEvent, RawDocument)
        .outerjoin(RawDocument, IntelligenceEvent.raw_document_id == RawDocument.id)
        .filter(IntelligenceEvent.id == event_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Event not found")
    event, raw = row
    return _serialize_event(event, raw)
