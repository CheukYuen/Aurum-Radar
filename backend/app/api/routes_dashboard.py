from fastapi import APIRouter
from app.api.routes_events import MOCK_EVENTS

router = APIRouter()


@router.get("/dashboard/summary")
def get_dashboard_summary():
    high_priority = sum(1 for e in MOCK_EVENTS if e["priority"] == "high")
    by_cat = {
        "opportunities": sum(1 for e in MOCK_EVENTS if e["cat"] in ("渠道", "社媒", "产品")),
        "competition":   sum(1 for e in MOCK_EVENTS if e["cat"] == "竞争"),
        "regulation":    sum(1 for e in MOCK_EVENTS if e["cat"] == "法规"),
    }
    return {
        "as_of": "2026-05-21T09:30:00Z",
        "radar": {
            "markets_scanned": 128,
            "documents_integrated": 2458,
            "high_priority_changes": high_priority,
            "judgments_generated": 12,
        },
        "events_today": len(MOCK_EVENTS),
        "events_today_delta": 12,
        "high_priority_events": high_priority,
        "pending_actions": 15,
        "pending_actions_delta": 3,
        "key_analysis": by_cat,
    }


@router.get("/overview")
def get_overview():
    raise NotImplementedError


@router.get("/markets/{market}")
def get_market(market: str):
    raise NotImplementedError


@router.get("/markets/{market}/districts")
def get_market_districts(market: str):
    raise NotImplementedError


@router.get("/districts/{district_id}")
def get_district(district_id: int):
    raise NotImplementedError
