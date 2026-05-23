from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.api import routes_health, routes_dashboard, routes_events, routes_brief, routes_actions, routes_jobs, routes_skills
from app.services.skills.registry import get_skill_registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry = get_skill_registry()
    registry.init()
    app.state.skill_registry = registry
    logger.info("[app] startup complete")
    yield


app = FastAPI(title=settings.APP_NAME, debug=settings.APP_DEBUG, lifespan=lifespan)

app.include_router(routes_health.router, prefix=settings.API_PREFIX)
app.include_router(routes_dashboard.router, prefix=settings.API_PREFIX)
app.include_router(routes_events.router, prefix=settings.API_PREFIX)
app.include_router(routes_brief.router, prefix=settings.API_PREFIX)
app.include_router(routes_actions.router, prefix=settings.API_PREFIX)
app.include_router(routes_jobs.router, prefix=settings.API_PREFIX)
app.include_router(routes_skills.router, prefix=settings.API_PREFIX)


@app.exception_handler(NotImplementedError)
async def not_implemented_handler(request: Request, exc: NotImplementedError):
    return JSONResponse(status_code=501, content={"error": {"code": "not_implemented", "message": "Not implemented yet"}})
