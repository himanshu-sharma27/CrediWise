"""Automated Tests for Loan Application Endpoints & Strict INR Validation.

Validates application submission, list retrieval, and adherence to the 11 Kaggle INR features.
"""

from __future__ import annotations

from typing import Dict
from fastapi.testclient import TestClient


def test_create_application_success(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that an applicant can create a loan application with valid INR fields."""
    response = client.post(
        "/api/v1/applications",
        json=valid_application_payload,
        headers=user_auth_headers,
    )
    assert response.status_code == 201
    data = response.json()

    assert data["applicant_name"] == valid_application_payload["applicant_name"]
    assert data["income_annum"] == valid_application_payload["income_annum"]
    assert data["loan_amount"] == valid_application_payload["loan_amount"]
    assert data["cibil_score"] == valid_application_payload["cibil_score"]
    assert data["status"] == "UNDER_REVIEW"
    assert data["application_number"].startswith("APP-")


def test_get_my_applications_list(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that an applicant can retrieve their submitted applications."""
    # Create two applications
    client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    payload_2 = {**valid_application_payload, "loan_amount": 5000000.0}
    client.post("/api/v1/applications", json=payload_2, headers=user_auth_headers)

    response = client.get("/api/v1/applications/me", headers=user_auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 2
    assert len(data["applications"]) == 2


def test_validation_rejects_negative_income(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that non-positive income_annum is rejected with HTTP 422."""
    invalid_payload = {**valid_application_payload, "income_annum": -500000.0}
    response = client.post(
        "/api/v1/applications",
        json=invalid_payload,
        headers=user_auth_headers,
    )
    assert response.status_code == 422


def test_validation_rejects_invalid_cibil(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that out-of-range CIBIL scores (< 300 or > 900) are rejected."""
    # Low CIBIL
    res_low = client.post(
        "/api/v1/applications",
        json={**valid_application_payload, "cibil_score": 250},
        headers=user_auth_headers,
    )
    assert res_low.status_code == 422

    # High CIBIL
    res_high = client.post(
        "/api/v1/applications",
        json={**valid_application_payload, "cibil_score": 950},
        headers=user_auth_headers,
    )
    assert res_high.status_code == 422


def test_validation_rejects_invalid_categorical(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies that invalid categorical values are rejected."""
    # Invalid education
    res_edu = client.post(
        "/api/v1/applications",
        json={**valid_application_payload, "education": "Doctorate"},
        headers=user_auth_headers,
    )
    assert res_edu.status_code == 422

    # Invalid self_employed
    res_emp = client.post(
        "/api/v1/applications",
        json={**valid_application_payload, "self_employed": "Freelancer"},
        headers=user_auth_headers,
    )
    assert res_emp.status_code == 422
