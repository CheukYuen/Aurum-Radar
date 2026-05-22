from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import ActionItem

router = APIRouter()


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _serialize_action(action: ActionItem) -> dict:
    return {
        "id": action.id,
        "market": action.market,
        "department": action.department,
        "priority": action.priority,
        "action_title": action.action_title,
        "action_detail": action.action_detail,
        "reason": action.reason,
        "deadline": action.deadline,
        "expected_output": action.expected_output,
        "success_metric": action.success_metric,
        "status": action.status,
        "event_id": action.event_id,
        "source_url": (action.extra or {}).get("source_url"),
        "created_at": _iso(action.created_at),
        "updated_at": _iso(action.updated_at),
    }


@router.get("/actions")
def list_actions(
    department: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(ActionItem)
    if department:
        q = q.filter(ActionItem.department == department)
    if priority:
        q = q.filter(ActionItem.priority == priority)
    if market:
        q = q.filter(ActionItem.market == market)
    if status:
        q = q.filter(ActionItem.status == status)
    rows = q.order_by(ActionItem.created_at.desc(), ActionItem.id.desc()).all()
    return {"items": [_serialize_action(row) for row in rows], "total": len(rows)}


@router.get("/actions/{action_id}")
def get_action(action_id: int, db: Session = Depends(get_db)):
    action = db.get(ActionItem, action_id)
    if action is None:
        raise HTTPException(status_code=404, detail="Action not found")
    return _serialize_action(action)
