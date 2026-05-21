from fastapi import APIRouter

router = APIRouter()


@router.get("/brief/latest")
def get_latest_brief():
    raise NotImplementedError


@router.get("/briefs/{brief_date}")
def get_brief_by_date(brief_date: str):
    raise NotImplementedError
