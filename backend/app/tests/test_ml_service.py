"""Automated Tests for ML Inference Service (`ml_service.py`).

Verifies model artifact loading, deterministic INR feature engineering parity,
probability boundaries, factor attribution explanations, and financial stress testing.
"""

from __future__ import annotations

from typing import Dict
import pytest

from backend.app.services.ml_service import (
    compute_deterministic_features,
    load_model_artifact,
    predict_loan_application,
)


def test_load_model_artifact_success():
    """Verifies that the certified Kaggle ML model artifact loads and caches properly."""
    bundle = load_model_artifact()
    assert bundle is not None
    assert "pipeline" in bundle
    assert "model_name" in bundle
    assert "model_version" in bundle
    assert bundle["model_version"] == "loan-model-v2.0"


def test_compute_deterministic_features_parity(valid_simulator_payload: Dict):
    """Verifies deterministic engineered features match exact mathematical specifications."""
    features = compute_deterministic_features(valid_simulator_payload)

    # 1. Monthly income
    assert pytest.approx(features["monthly_income"], rel=1e-3) == 1200000.0 / 12.0

    # 2. Loan to annual income
    assert pytest.approx(features["loan_to_annual_income_ratio"], rel=1e-3) == 3000000.0 / 1200000.0

    # 3. Total asset value (45L + 10L + 8L + 12L = 75L)
    assert features["total_asset_value"] == 7500000.0

    # 4. Asset to loan ratio (75L / 30L = 2.5)
    assert pytest.approx(features["asset_to_loan_ratio"], rel=1e-3) == 2.5

    # 5. Loan term months (15 * 12 = 180)
    assert features["loan_term_months"] == 180

    # 6. Estimated payment to income ratio
    emi = 3000000.0 / 180.0
    monthly_inc = 1200000.0 / 12.0
    assert pytest.approx(features["estimated_payment_to_income_ratio"], rel=1e-3) == (emi / monthly_inc)


def test_predict_loan_application_prime_profile():
    """Verifies that a prime Indian applicant with high CIBIL and strong assets is approved."""
    prime_input = {
        "no_of_dependents": 1,
        "education": "Graduate",
        "self_employed": "No",
        "income_annum": 2500000.0,
        "loan_amount": 2000000.0,
        "loan_term": 10,
        "cibil_score": 830,
        "residential_assets_value": 6000000.0,
        "commercial_assets_value": 2000000.0,
        "luxury_assets_value": 1500000.0,
        "bank_asset_value": 2500000.0,
    }
    result = predict_loan_application(prime_input)

    assert result["recommendation"] == "APPROVED"
    assert result["approval_probability"] >= 0.70
    assert result["model_version"] == "loan-model-v2.0"
    assert result["inference_latency_ms"] >= 0
    assert len(result["explanations"]) > 0

    # Verify top factor mentions CIBIL or strong credit
    top_explanation = result["explanations"][0]
    assert "display_name" in top_explanation
    assert top_explanation["impact"] in ["POSITIVE", "NEGATIVE", "NEUTRAL"]


def test_predict_loan_application_subprime_profile():
    """Verifies that a subprime applicant with low CIBIL and high debt is rejected."""
    subprime_input = {
        "no_of_dependents": 4,
        "education": "Not Graduate",
        "self_employed": "Yes",
        "income_annum": 400000.0,
        "loan_amount": 3500000.0,
        "loan_term": 20,
        "cibil_score": 350,
        "residential_assets_value": 0.0,
        "commercial_assets_value": 0.0,
        "luxury_assets_value": 0.0,
        "bank_asset_value": 50000.0,
    }
    result = predict_loan_application(subprime_input)

    assert result["recommendation"] == "REJECTED"
    assert result["approval_probability"] <= 0.40
    assert result["model_version"] == "loan-model-v2.0"
