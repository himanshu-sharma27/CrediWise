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


def normalize_database_url(url: Optional[str]) -> str:
    """Normalizes PostgreSQL database URLs to ensure Psycopg 3 dialect is used.

    Render, Heroku, and other cloud providers often provide DATABASE_URL starting with
    'postgres://' or 'postgresql://', which SQLAlchemy defaults to the 'psycopg2' driver.
    This normalizes any PostgreSQL connection scheme to 'postgresql+psycopg://'.
    """
    if not url:
        return f"sqlite:///{PROJECT_ROOT / 'crediwise.db'}"
    url_str = str(url).strip()
    if url_str.startswith("postgres://"):
        return "postgresql+psycopg://" + url_str[len("postgres://"):]
    if url_str.startswith("postgresql+psycopg2://"):
        return "postgresql+psycopg://" + url_str[len("postgresql+psycopg2://"):]
    if url_str.startswith("postgresql://") and not url_str.startswith("postgresql+"):
        return "postgresql+psycopg://" + url_str[len("postgresql://"):]
    return url_str


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
    MODEL_VERSION: str = "loan-model-v2.1-synthetic-10000"
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: Optional[str]) -> str:
        return normalize_database_url(v)

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
