from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api import routes_health, routes_dashboard, routes_events, routes_brief, routes_actions, routes_jobs

app = FastAPI(title=settings.APP_NAME, debug=settings.APP_DEBUG)

app.include_router(routes_health.router, prefix=settings.API_PREFIX)
app.include_router(routes_dashboard.router, prefix=settings.API_PREFIX)
app.include_router(routes_events.router, prefix=settings.API_PREFIX)
app.include_router(routes_brief.router, prefix=settings.API_PREFIX)
app.include_router(routes_actions.router, prefix=settings.API_PREFIX)
app.include_router(routes_jobs.router, prefix=settings.API_PREFIX)


@app.exception_handler(NotImplementedError)
async def not_implemented_handler(request: Request, exc: NotImplementedError):
    return JSONResponse(status_code=501, content={"error": {"code": "not_implemented", "message": "Not implemented yet"}})
