"""CrediWiseAI - Administrator, Analytics, and Model Monitoring API Tests.

Verifies strict server-side RBAC protection, KPI calculations, user directory serialization,
and model monitoring telemetry.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_admin_dashboard_unauthorized(client: TestClient):
    """Unauthenticated access to admin dashboard must be rejected with 401."""
    res = client.get("/api/v1/admin/dashboard")
    assert res.status_code == 401


def test_admin_dashboard_forbidden_for_user(client: TestClient, user_auth_headers):
    """Standard user access to admin dashboard must be rejected with 403."""
    res = client.get("/api/v1/admin/dashboard", headers=user_auth_headers)
    assert res.status_code == 403
    assert "Administrative privileges required" in res.json()["detail"]


def test_admin_dashboard_success(client: TestClient, admin_auth_headers):
    """Admin access to dashboard returns executive KPIs."""
    res = client.get("/api/v1/admin/dashboard", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_applications" in data
    assert "approval_rate" in data
    assert "total_requested_loan_amount" in data
    assert "average_loan_amount" in data
    assert "risk_distribution" in data
    assert "status_distribution" in data
    assert isinstance(data["recent_applications"], list)


def test_admin_users_list_forbidden_for_user(client: TestClient, user_auth_headers):
    """Standard user access to admin users directory must be rejected with 403."""
    res = client.get("/api/v1/admin/users", headers=user_auth_headers)
    assert res.status_code == 403


def test_admin_users_list_success(client: TestClient, admin_auth_headers):
    """Admin can retrieve user directory; verifies no sensitive secrets are leaked."""
    res = client.get("/api/v1/admin/users", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert len(data["users"]) >= 1

    first_user = data["users"][0]
    assert "id" in first_user
    assert "name" in first_user
    assert "email" in first_user
    assert "role" in first_user
    assert "application_count" in first_user
    # Ensure no security leaks
    assert "password_hash" not in first_user
    assert "hashed_password" not in first_user
    assert "token" not in first_user


def test_admin_analytics_success(client: TestClient, admin_auth_headers):
    """Admin can retrieve aggregated portfolio analytics."""
    res = client.get("/api/v1/admin/analytics", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_applications" in data
    assert "cibil_bands" in data
    assert "loan_amount_bands" in data
    assert "risk_distribution" in data
    assert "education_distribution" in data
    assert "employment_distribution" in data
    assert "total_loan_volume" in data
    assert "total_asset_volume" in data


def test_admin_monitoring_success(client: TestClient, admin_auth_headers):
    """Admin can retrieve model monitoring metadata, candidate comparisons, and telemetry."""
    res = client.get("/api/v1/admin/monitoring", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["model_version"] == "loan-model-v2.0"
    assert data["algorithm"] == "Gradient Boosting"
    assert data["status"] == "ACTIVE"
    assert "total_predictions" in data
    assert "average_latency_ms" in data
    assert "training_metrics" in data
    assert "feature_importance" in data
    assert isinstance(data["recent_predictions"], list)
    assert "all_models_test_metrics" in data
    assert "all_models_cv_metrics" in data
    assert "candidate_models" in data
    assert data["champion_model"] == "Gradient Boosting"
    assert data["champion_version"] == "loan-model-v2.0"
    assert "Logistic Regression" in data["all_models_test_metrics"]
    assert "Decision Tree" in data["all_models_test_metrics"]
    assert "Random Forest" in data["all_models_test_metrics"]
    assert "Gradient Boosting" in data["all_models_test_metrics"]


def test_admin_monitoring_feature_importance_regression(client: TestClient, admin_auth_headers):
    """Regression test: verify monitoring endpoint returns non-empty, descending numeric feature importances."""
    res = client.get("/api/v1/admin/monitoring", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "feature_importance" in data
    fi = data["feature_importance"]
    assert isinstance(fi, dict)
    assert len(fi) > 0, "Feature importance dictionary must not be empty"

    # Verify keys are non-empty strings and values are non-negative numeric floats
    for feature_name, importance_val in fi.items():
        assert isinstance(feature_name, str)
        assert len(feature_name) > 0
        assert isinstance(importance_val, (int, float))
        assert importance_val >= 0.0

    # Verify descending ordering
    values = list(fi.values())
    for i in range(len(values) - 1):
        assert values[i] >= values[i + 1], f"Values not descending: {values[i]} < {values[i+1]}"

    # Verify prominent features from certified model artifact are present
    assert "cibil_score" in fi

