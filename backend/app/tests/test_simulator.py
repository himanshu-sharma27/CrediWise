"""Automated Tests for What-If Scenario Simulator API (`predictions.py`).

Verifies real-time simulation parity with the core ML inference service, parameter sensitivity,
and absence of unwanted database records.
"""

from __future__ import annotations

from typing import Dict
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.models import LoanApplication, PredictionResult


def test_simulator_inference_success(
    client: TestClient,
    valid_simulator_payload: Dict,
    db_session: Session,
):
    """Verifies that simulator runs real-time inference and does not persist DB records."""
    # Count initial applications and predictions
    initial_apps = db_session.query(LoanApplication).count()
    initial_preds = db_session.query(PredictionResult).count()

    response = client.post("/api/v1/predictions/simulator", json=valid_simulator_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["model_version"] == "loan-model-v2.0"
    assert data["recommendation"] in ["APPROVED", "REJECTED"]
    assert 0.0 <= data["approval_probability"] <= 1.0
    assert "derived_indicators" in data
    assert "risk_assessment" in data
    assert "input_summary" in data
    assert len(data["explanations"]) > 0

    # Ensure NO database entities were created
    assert db_session.query(LoanApplication).count() == initial_apps
    assert db_session.query(PredictionResult).count() == initial_preds


def test_simulator_alias_simulate_endpoint(
    client: TestClient,
    valid_simulator_payload: Dict,
):
    """Verifies /predictions/simulate alias works identically."""
    response = client.post("/api/v1/predictions/simulate", json=valid_simulator_payload)
    assert response.status_code == 200
    assert response.json()["model_version"] == "loan-model-v2.0"


def test_simulator_sensitivity_cibil_increase(
    client: TestClient,
    valid_simulator_payload: Dict,
):
    """Verifies that improving CIBIL score increases approval probability."""
    low_cibil_payload = {**valid_simulator_payload, "cibil_score": 450}
    high_cibil_payload = {**valid_simulator_payload, "cibil_score": 820}

    res_low = client.post("/api/v1/predictions/simulator", json=low_cibil_payload)
    res_high = client.post("/api/v1/predictions/simulator", json=high_cibil_payload)

    prob_low = res_low.json()["approval_probability"]
    prob_high = res_high.json()["approval_probability"]

    assert prob_high > prob_low
