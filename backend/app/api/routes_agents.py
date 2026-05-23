from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db

router = APIRouter()


class AgentQuery(BaseModel):
    type: str = Field(..., description="Agent 类型，如 correlation_analysis")
    event_ids: list[int] | None = Field(None, description="指定事件 ID 列表")
    market: str | None = Field(None, description="按市场过滤")
    time_window: dict[str, str] | None = Field(
        None, description="时间窗口 {start, end}，ISO8601 日期"
    )
    options: dict[str, Any] = {}


@router.get("/agents")
def list_agents(request: Request):
    router_obj = request.app.state.agent_router
    return {"agents": router_obj.list_agents()}


@router.post("/agents/dispatch")
def dispatch_agent(body: AgentQuery, request: Request, db: Session = Depends(get_db)):
    router_obj = request.app.state.agent_router
    query = body.model_dump(exclude_none=True, exclude={"options"})
    query.update(body.options)
    try:
        result = router_obj.dispatch(query, db)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
