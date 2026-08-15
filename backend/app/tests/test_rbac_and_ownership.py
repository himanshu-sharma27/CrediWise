"""Automated Tests for Role-Based Access Control (RBAC) and Ownership Isolation.

Ensures strict security boundaries between standard applicants and administrators,
preventing cross-user unauthorized access and privilege escalation.
"""

from __future__ import annotations

from typing import Dict
from fastapi.testclient import TestClient


def test_unauthenticated_request_rejected(client: TestClient):
    """Verifies that protected routes reject requests without a Bearer token."""
    response = client.get("/api/v1/applications/me")
    assert response.status_code == 401

    response_pred = client.get("/api/v1/predictions/me")
    assert response_pred.status_code == 401


def test_user_cannot_access_admin_endpoint(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """Verifies that a standard applicant (role='user') cannot access admin routes."""
    # GET /api/v1/applications is admin only
    response = client.get("/api/v1/applications", headers=user_auth_headers)
    assert response.status_code == 403
    assert "Administrative privileges required" in response.json()["detail"]


def test_admin_can_access_admin_endpoint(
    client: TestClient,
    admin_auth_headers: Dict[str, str],
):
    """Verifies that an administrator (role='admin') can access admin routes."""
    response = client.get("/api/v1/applications", headers=admin_auth_headers)
    assert response.status_code == 200
    assert "applications" in response.json()


def test_user_cannot_view_other_user_application(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    other_user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that User A cannot view an application created by User B."""
    # User B creates an application
    create_res = client.post(
        "/api/v1/applications",
        json=valid_application_payload,
        headers=other_user_auth_headers,
    )
    assert create_res.status_code == 201
    user_b_app_id = create_res.json()["id"]

    # User A tries to view User B's application -> 403 Forbidden
    get_res = client.get(
        f"/api/v1/applications/{user_b_app_id}",
        headers=user_auth_headers,
    )
    assert get_res.status_code == 403
    assert "Access forbidden" in get_res.json()["detail"]


def test_admin_can_view_any_user_application(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    admin_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that an administrator can view any user's application."""
    # User creates application
    create_res = client.post(
        "/api/v1/applications",
        json=valid_application_payload,
        headers=user_auth_headers,
    )
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]

    # Admin reads application -> 200 OK
    admin_get_res = client.get(
        f"/api/v1/applications/{app_id}",
        headers=admin_auth_headers,
    )
    assert admin_get_res.status_code == 200
    assert admin_get_res.json()["id"] == app_id


def test_user_cannot_trigger_prediction_on_other_user_application(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    other_user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that User A cannot trigger ML prediction for User B's application."""
    # User B creates application
    create_res = client.post(
        "/api/v1/applications",
        json=valid_application_payload,
        headers=other_user_auth_headers,
    )
    assert create_res.status_code == 201
    user_b_app_id = create_res.json()["id"]

    # User A attempts to trigger prediction -> 403 Forbidden
    pred_res = client.post(
        f"/api/v1/predictions/applications/{user_b_app_id}",
        headers=user_auth_headers,
    )
    assert pred_res.status_code == 403
    assert "Access forbidden" in pred_res.json()["detail"]
