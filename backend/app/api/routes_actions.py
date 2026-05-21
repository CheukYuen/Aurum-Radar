from fastapi import APIRouter

router = APIRouter()


@router.get("/actions")
def list_actions():
    raise NotImplementedError


@router.get("/actions/{action_id}")
def get_action(action_id: int):
    raise NotImplementedError
