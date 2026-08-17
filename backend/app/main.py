"""CrediWise - FastAPI Application Entry Point.

Configures CORS, initializes database schema, loads the immutable Kaggle ML artifact,
and mounts all API routers under /api/v1.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.admin import router as admin_router
from backend.app.api.applications import router as applications_router
from backend.app.api.auth import router as auth_router
from backend.app.api.eligibility import router as eligibility_router
from backend.app.api.predictions import router as predictions_router
from backend.app.core.config import settings
from backend.app.db.session import init_db
from backend.app.schemas.schemas import HealthCheckResponse
from backend.app.services.ml_service import load_model_artifact

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("crediwise")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle manager."""
    logger.info("Initializing CrediWiseAI Backend Service...")
    # 1. Initialize SQLite Database Schema
    init_db()
    logger.info("Database schema verified and initialized.")

    # 2. Warm up / cache ML Model Artifact
    try:
        load_model_artifact()
        logger.info("ML Model Artifact (loan-model-v2.0) cached successfully.")
    except Exception as e:
        logger.error(f"Failed to load ML Model Artifact during startup: {e}")

    yield
    logger.info("Shutting down CrediWiseAI Backend Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Intelligent loan approval prediction and risk explainability API powered by Gradient Boosting ML (INR Native).",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    f"{settings.API_V1_STR}/health",
    response_model=HealthCheckResponse,
    tags=["System"],
    summary="Health check and service status",
)
def health_check() -> HealthCheckResponse:
    """Returns system status, active database backend, and ML model status."""
    is_model_loaded = False
    try:
        bundle = load_model_artifact()
        is_model_loaded = bundle is not None
    except Exception:
        is_model_loaded = False

    return HealthCheckResponse(
        status="ok",
        project=settings.PROJECT_NAME,
        model_version=settings.MODEL_VERSION,
        model_loaded=is_model_loaded,
        database="SQLite",
        currency=settings.DEFAULT_CURRENCY,
        timestamp=datetime.now(timezone.utc),
    )


# Register API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(eligibility_router, prefix=settings.API_V1_STR)
app.include_router(applications_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

