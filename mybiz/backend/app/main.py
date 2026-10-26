from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, close_db
import app.database as db_module
from app.routers import (
    auth, dashboard, personal, business, analytics, forecast, ai, notifications, export
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    is_testing = getattr(app.state, "testing", False)
    if db_module.client is None and not is_testing:
        await init_db()
    yield
    if not is_testing:
        await close_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personal Business Advisor and Financial Management System API with MongoDB",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(personal.router, prefix=settings.API_V1_STR)
app.include_router(business.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(forecast.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(export.router, prefix=settings.API_V1_STR)

@app.get("/healthz")
def healthz():
    return {"status": "ok", "app": settings.PROJECT_NAME, "database": "mongodb"}

@app.get("/")
def root():
    return {
        "message": "Welcome to MyBIZ API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/healthz",
        "database": "mongodb"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
