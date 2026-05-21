from fastapi import APIRouter

router = APIRouter()


@router.get("/jobs/status")
def get_jobs_status():
    raise NotImplementedError


@router.post("/jobs/run")
def run_job():
    raise NotImplementedError
