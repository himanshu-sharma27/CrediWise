"""Automated Tests for Health Check and Public Eligibility API (`eligibility.py`, `main.py`).

Verifies system health reporting, ML model readiness, and public Kaggle INR feature guidelines.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    """Verifies that the health check endpoint returns 200 OK with model status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ok"
    assert data["model_version"] == "loan-model-v2.0"
    assert data["model_loaded"] is True
    assert data["database"] == "SQLite"
    assert data["currency"] == "INR"
    assert "timestamp" in data


def test_eligibility_rules_endpoint(client: TestClient):
    """Verifies that public eligibility guidelines return the 11 Kaggle INR features."""
    response = client.get("/api/v1/eligibility/rules")
    assert response.status_code == 200
    data = response.json()

    assert data["currency"] == "INR"
    assert data["currency_symbol"] == "₹"
    assert data["model_version"] == "loan-model-v2.0"
    assert len(data["features"]) == 11
    assert "cibil_score_guide" in data

    feature_names = [f["field_name"] for f in data["features"]]
    assert "income_annum" in feature_names
    assert "loan_amount" in feature_names
    assert "cibil_score" in feature_names
    assert "bank_asset_value" in feature_names
    assert "residential_assets_value" in feature_names
    assert "commercial_assets_value" in feature_names
    assert "luxury_assets_value" in feature_names
