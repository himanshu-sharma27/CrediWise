"""Automated Tests for Prediction API Endpoints (`predictions.py`).

Verifies prediction execution on applications, database persistence, status updates,
prediction history retrieval, and error states.
"""

from __future__ import annotations

from typing import Dict
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.models import LoanApplication, PredictionResult


def test_generate_prediction_success(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
    db_session: Session,
):
    """Verifies that an applicant can trigger an ML prediction for their submitted application."""
    # 1. Create Application
    create_res = client.post(
        "/api/v1/applications",
        json=valid_application_payload,
        headers=user_auth_headers,
    )
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]

    # 2. Trigger ML Prediction
    pred_res = client.post(
        f"/api/v1/predictions/applications/{app_id}",
        headers=user_auth_headers,
    )
    assert pred_res.status_code == 200
    pred_data = pred_res.json()

    assert pred_data["application_id"] == app_id
    assert pred_data["model_version"] == "loan-model-v2.0"
    assert pred_data["recommendation"] in ["APPROVED", "REJECTED"]
    assert 0.0 <= pred_data["approval_probability"] <= 1.0
    assert pred_data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert len(pred_data["explanations"]) > 0
    assert "derived_indicators" in pred_data
    assert "risk_assessment" in pred_data

    # 3. Verify application status in DB is updated to recommendation
    db_app = db_session.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    assert db_app.status == pred_data["recommendation"]

    # 4. Verify PredictionResult is stored in DB
    db_pred = db_session.query(PredictionResult).filter(PredictionResult.application_id == app_id).first()
    assert db_pred is not None
    assert db_pred.recommendation == pred_data["recommendation"]


def test_get_latest_application_prediction(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies retrieving the latest prediction for an application."""
    # Create and predict
    create_res = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_res.json()["id"]
    client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)

    # Fetch latest prediction
    get_pred_res = client.get(
        f"/api/v1/predictions/applications/{app_id}",
        headers=user_auth_headers,
    )
    assert get_pred_res.status_code == 200
    data = get_pred_res.json()
    assert data["application_id"] == app_id
    assert "approval_probability" in data


def test_get_my_predictions_history(
    client: TestClient,
    user_auth_headers: Dict[str, str],
    valid_application_payload: Dict,
):
    """Verifies retrieving the user's prediction history."""
    # Create and predict application
    create_res = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_res.json()["id"]
    client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)

    # Query history
    history_res = client.get("/api/v1/predictions/me", headers=user_auth_headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 1
    assert history[0]["application_id"] == app_id


def test_predict_nonexistent_application_404(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """Verifies predicting a non-existent application returns HTTP 404."""
    response = client.post(
        "/api/v1/predictions/applications/99999",
        headers=user_auth_headers,
    )
    assert response.status_code == 404
