"""Pytest fixtures for CrediWiseAI Backend Tests.

Sets up an isolated in-memory SQLite database, FastAPI TestClient,
test users (standard applicant and administrator), and authentication tokens.
"""

from __future__ import annotations

from typing import Dict, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.security import create_access_token, get_password_hash
from backend.app.db.session import Base, get_db
from backend.app.main import app
from backend.app.models.models import User

# In-memory SQLite engine for fast, isolated test runs
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Creates a fresh database schema for each test and yields a clean session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient with overridden get_db dependency."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> User:
    """Creates a standard test applicant user with role='user'."""
    user = User(
        name="Rajesh Sharma",
        email="rajesh.sharma@example.com",
        password_hash=get_password_hash("Password@123"),
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def other_user(db_session: Session) -> User:
    """Creates a secondary test user to verify ownership isolation."""
    user = User(
        name="Priya Patel",
        email="priya.patel@example.com",
        password_hash=get_password_hash("Password@123"),
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_admin(db_session: Session) -> User:
    """Creates an administrator user with role='admin'."""
    admin = User(
        name="Admin Reviewer",
        email="admin@credwise.ai",
        password_hash=get_password_hash("AdminSecret@123"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def test_user_token(test_user: User) -> str:
    """Generates a valid JWT token for test_user."""
    return create_access_token(subject=test_user.email, role=test_user.role)


@pytest.fixture(scope="function")
def other_user_token(other_user: User) -> str:
    """Generates a valid JWT token for other_user."""
    return create_access_token(subject=other_user.email, role=other_user.role)


@pytest.fixture(scope="function")
def test_admin_token(test_admin: User) -> str:
    """Generates a valid JWT token for test_admin."""
    return create_access_token(subject=test_admin.email, role=test_admin.role)


@pytest.fixture(scope="function")
def user_auth_headers(test_user_token: str) -> Dict[str, str]:
    """Returns Authorization headers for test_user."""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture(scope="function")
def other_user_auth_headers(other_user_token: str) -> Dict[str, str]:
    """Returns Authorization headers for other_user."""
    return {"Authorization": f"Bearer {other_user_token}"}


@pytest.fixture(scope="function")
def admin_auth_headers(test_admin_token: str) -> Dict[str, str]:
    """Returns Authorization headers for test_admin."""
    return {"Authorization": f"Bearer {test_admin_token}"}


@pytest.fixture(scope="function")
def valid_application_payload() -> Dict:
    """Standard valid 11 Kaggle INR-native features payload."""
    return {
        "applicant_name": "Rajesh Sharma",
        "no_of_dependents": 2,
        "education": "Graduate",
        "self_employed": "No",
        "income_annum": 1200000.0,
        "loan_amount": 3000000.0,
        "loan_term": 15,
        "cibil_score": 780,
        "residential_assets_value": 4500000.0,
        "commercial_assets_value": 1000000.0,
        "luxury_assets_value": 800000.0,
        "bank_asset_value": 1200000.0,
    }


@pytest.fixture(scope="function")
def valid_simulator_payload() -> Dict:
    """Standard valid 11 Kaggle INR-native features simulator payload."""
    return {
        "no_of_dependents": 2,
        "education": "Graduate",
        "self_employed": "No",
        "income_annum": 1200000.0,
        "loan_amount": 3000000.0,
        "loan_term": 15,
        "cibil_score": 780,
        "residential_assets_value": 4500000.0,
        "commercial_assets_value": 1000000.0,
        "luxury_assets_value": 800000.0,
        "bank_asset_value": 1200000.0,
    }
