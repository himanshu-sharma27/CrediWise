"""CrediWiseAI - Database Configuration & Psycopg 3 Driver Normalization Tests.

Verifies that PostgreSQL connection strings (postgres://, postgresql://, postgresql+psycopg2://)
are strictly normalized to use the Psycopg 3 driver (postgresql+psycopg://) without attempting
to load legacy psycopg2, while preserving SQLite and existing settings behaviors.
"""

from __future__ import annotations

import os
import pytest
from sqlalchemy import create_engine

from backend.app.core.config import Settings, normalize_database_url


def test_normalize_database_url_postgres_scheme():
    """Verifies that postgres:// is normalized to postgresql+psycopg://."""
    raw_url = "postgres://usr_prod:p%40ssw0rd@dpg-c12345-a.singapore-postgres.render.com:5432/crediwise_db"
    expected = "postgresql+psycopg://usr_prod:p%40ssw0rd@dpg-c12345-a.singapore-postgres.render.com:5432/crediwise_db"
    assert normalize_database_url(raw_url) == expected


def test_normalize_database_url_postgresql_scheme():
    """Verifies that postgresql:// is normalized to postgresql+psycopg://."""
    raw_url = "postgresql://postgres:SecretPassword123@localhost:5432/crediwise"
    expected = "postgresql+psycopg://postgres:SecretPassword123@localhost:5432/crediwise"
    assert normalize_database_url(raw_url) == expected


def test_normalize_database_url_psycopg2_scheme():
    """Verifies that postgresql+psycopg2:// is normalized to postgresql+psycopg://."""
    raw_url = "postgresql+psycopg2://postgres:SecretPassword123@localhost:5432/crediwise"
    expected = "postgresql+psycopg://postgres:SecretPassword123@localhost:5432/crediwise"
    assert normalize_database_url(raw_url) == expected


def test_normalize_database_url_already_psycopg3():
    """Verifies that postgresql+psycopg:// is preserved without alteration."""
    raw_url = "postgresql+psycopg://user:pass@host.render.com:5432/db"
    assert normalize_database_url(raw_url) == raw_url


def test_normalize_database_url_sqlite_preservation():
    """Verifies that SQLite URLs remain intact."""
    sqlite_url = "sqlite:///./crediwise.db"
    memory_url = "sqlite:///:memory:"
    assert normalize_database_url(sqlite_url) == sqlite_url
    assert normalize_database_url(memory_url) == memory_url


def test_normalize_database_url_empty_or_none():
    """Verifies fallback when URL is empty or None."""
    default_url = normalize_database_url(None)
    assert default_url.startswith("sqlite:///")
    assert "crediwise.db" in default_url


def test_settings_database_url_validator_postgres_env():
    """Verifies Settings model field validator normalizes postgres:// from environment."""
    test_settings = Settings(
        DATABASE_URL="postgres://render_user:render_pass@dpg-render-internal:5432/crediwise_prod"
    )
    assert test_settings.DATABASE_URL.startswith("postgresql+psycopg://")
    assert "render_user:render_pass" in test_settings.DATABASE_URL


def test_settings_database_url_validator_postgresql_env():
    """Verifies Settings model field validator normalizes postgresql:// from environment."""
    test_settings = Settings(
        DATABASE_URL="postgresql://render_user:render_pass@dpg-render-internal:5432/crediwise_prod"
    )
    assert test_settings.DATABASE_URL.startswith("postgresql+psycopg://")


def test_sqlalchemy_engine_loads_psycopg3_dialect():
    """Verifies create_engine creates a Postgres engine using the Psycopg 3 dialect ('psycopg') without psycopg2."""
    raw_url = "postgres://test_user:test_pass@localhost:5432/test_db"
    normalized = normalize_database_url(raw_url)

    engine = create_engine(normalized, pool_pre_ping=True)
    assert engine.dialect.name == "postgresql"
    assert engine.dialect.driver == "psycopg"
