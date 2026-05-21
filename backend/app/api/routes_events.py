from fastapi import APIRouter

router = APIRouter()


@router.get("/events")
def list_events():
    raise NotImplementedError


@router.get("/events/{event_id}")
def get_event(event_id: int):
    raise NotImplementedError
