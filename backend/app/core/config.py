"""CrediWiseAI - Application Configuration.

Loads environment variables, defines security parameters, database URLs,
and paths for the immutable Kaggle INR-native ML model artifact.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional, Union

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base project directory resolution
PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Application Settings and Environment Configuration."""

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Project Information
    PROJECT_NAME: str = "CrediWise - Smart Loan Decision Platform"
    PROJECT_VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security & JWT Authentication
    SECRET_KEY: str = "crediwise-ai-inr-production-secret-key-change-in-prod-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours

    # Database
    DATABASE_URL: str = f"sqlite:///{PROJECT_ROOT / 'crediwise.db'}"

    # Machine Learning Model Configuration
    MODEL_PATH: str = str(PROJECT_ROOT / "ml" / "models" / "loan_model_v2.joblib")
    MODEL_VERSION: str = "loan-model-v2.0"
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]


settings = Settings()
