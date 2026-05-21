from fastapi import APIRouter

router = APIRouter()


@router.get("/dashboard/summary")
def get_dashboard_summary():
    raise NotImplementedError


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
