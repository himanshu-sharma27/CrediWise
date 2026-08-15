"""Unit and Integration Tests for CrediWiseAI Authentication Endpoints.

Tests registration, duplicate protection, login verification, token generation,
password hash exclusion, and role enforcement.
"""

from __future__ import annotations

from typing import Dict
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.models import User


def test_register_user_success(client: TestClient, db_session: Session):
    """Verifies that a new applicant account can be successfully registered."""
    payload = {
        "name": "Aarav Gupta",
        "email": "aarav.gupta@example.com",
        "password": "SecurePassword@123",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["name"] == "Aarav Gupta"
    assert data["user"]["email"] == "aarav.gupta@example.com"
    assert data["user"]["role"] == "user"  # Public registration always forces role='user'
    assert "password_hash" not in data["user"]
    assert "password" not in data["user"]

    # Verify user exists in database
    db_user = db_session.query(User).filter(User.email == "aarav.gupta@example.com").first()
    assert db_user is not None
    assert db_user.role == "user"


def test_register_duplicate_email_conflict(client: TestClient, test_user: User):
    """Verifies that registering an existing email returns HTTP 409 Conflict."""
    payload = {
        "name": "Duplicate User",
        "email": test_user.email,  # Already registered
        "password": "AnotherPassword@123",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_success(client: TestClient, test_user: User):
    """Verifies successful authentication returns a valid JWT token."""
    payload = {
        "email": test_user.email,
        "password": "Password@123",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_user.email
    assert data["user"]["role"] == "user"


def test_login_invalid_password(client: TestClient, test_user: User):
    """Verifies that invalid password returns HTTP 401 Unauthorized."""
    payload = {
        "email": test_user.email,
        "password": "WrongPassword@999",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_nonexistent_email(client: TestClient):
    """Verifies that non-existent email returns HTTP 401 Unauthorized."""
    payload = {
        "email": "nonexistent@example.com",
        "password": "AnyPassword@123",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_get_current_user_profile(
    client: TestClient,
    test_user: User,
    user_auth_headers: Dict[str, str],
):
    """Verifies /auth/me returns the authenticated user's profile."""
    response = client.get("/api/v1/auth/me", headers=user_auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == test_user.id
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name
    assert data["role"] == "user"
    assert "password_hash" not in data


def test_get_current_user_profile_unauthorized(client: TestClient):
    """Verifies /auth/me returns HTTP 401 when accessed without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
