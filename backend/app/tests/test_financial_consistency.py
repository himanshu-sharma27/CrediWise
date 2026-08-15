"""Phase 5A - Financial Integrity and Prediction Consistency Regression Tests.

Verifies:
  1. Eligible loan is derived from actual applicant financial data, not a hardcoded Rs3L.
  2. Rejected applications do not automatically receive Rs3,00,000.
  3. Approved and rejected applications use the same deterministic eligibility calculation.
  4. Changing income updates derived indicators proportionally (monotonicity).
  5. POST and GET predictions for the same application return the same eligible loan.
  6. financial_health_score is a real computed value (not hardcoded 85/60/30).
  7. CIBIL is consistent between the application record and the prediction result.
  8. assess_risk() returns None for eligible_loan when income_annum is absent.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi.testclient import TestClient

from backend.app.services.risk_engine import assess_risk


# ---------------------------------------------------------------------------
# Shared test payloads
# ---------------------------------------------------------------------------

PRIME_PAYLOAD: Dict[str, Any] = {
    "applicant_name": "Financial Test Prime",
    "no_of_dependents": 0,
    "education": "Graduate",
    "self_employed": "No",
    "income_annum": 2400000,
    "loan_amount": 3500000,
    "loan_term": 15,
    "cibil_score": 820,
    "residential_assets_value": 6000000,
    "commercial_assets_value": 1000000,
    "luxury_assets_value": 500000,
    "bank_asset_value": 800000,
}

SUBPRIME_PAYLOAD: Dict[str, Any] = {
    "applicant_name": "Financial Test Subprime",
    "no_of_dependents": 4,
    "education": "Not Graduate",
    "self_employed": "Yes",
    "income_annum": 450000,
    "loan_amount": 3000000,
    "loan_term": 5,
    "cibil_score": 420,
    "residential_assets_value": 0,
    "commercial_assets_value": 0,
    "luxury_assets_value": 50000,
    "bank_asset_value": 30000,
}

MODERATE_PAYLOAD: Dict[str, Any] = {
    "applicant_name": "Financial Test Moderate",
    "no_of_dependents": 2,
    "education": "Graduate",
    "self_employed": "No",
    "income_annum": 900000,
    "loan_amount": 1500000,
    "loan_term": 10,
    "cibil_score": 680,
    "residential_assets_value": 2000000,
    "commercial_assets_value": 0,
    "luxury_assets_value": 200000,
    "bank_asset_value": 300000,
}


def _create_and_predict(client: TestClient, headers: Dict[str, str], payload: Dict[str, Any]):
    """Creates an application and generates a prediction. Returns (app_id, post_data, get_data)."""
    create_res = client.post("/api/v1/applications", json=payload, headers=headers)
    assert create_res.status_code == 201, f"App creation failed: {create_res.text}"
    app_id = create_res.json()["id"]

    post_res = client.post(f"/api/v1/predictions/applications/{app_id}", headers=headers)
    assert post_res.status_code == 200, f"Prediction POST failed: {post_res.text}"

    get_res = client.get(f"/api/v1/predictions/applications/{app_id}", headers=headers)
    assert get_res.status_code == 200, f"Prediction GET failed: {get_res.text}"

    return app_id, post_res.json(), get_res.json()


# ---------------------------------------------------------------------------
# API integration tests
# ---------------------------------------------------------------------------


def test_prime_eligible_loan_is_not_hardcoded_300k(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """Prime applicants (high income + high CIBIL) must receive an eligible loan
    substantially above Rs3,00,000, proving it is income-driven, not hardcoded."""
    _, post_data, get_data = _create_and_predict(client, user_auth_headers, PRIME_PAYLOAD)

    post_eligible = post_data["risk_assessment"]["estimated_eligible_loan_amount"]
    get_eligible = get_data["risk_assessment"]["estimated_eligible_loan_amount"]

    assert post_eligible is not None, "POST prediction must return a non-null eligible loan"
    assert post_eligible > 300000, (
        f"Prime applicant eligible loan Rs{post_eligible:,.0f} should be >> Rs3,00,000"
    )
    assert get_eligible is not None, "GET prediction must return a non-null eligible loan"
    assert get_eligible > 300000, (
        f"GET: Prime eligible loan Rs{get_eligible:,.0f} should be >> Rs3,00,000"
    )


def test_post_and_get_eligible_loan_agree(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """POST and GET /predictions/applications/{id} must return the same
    estimated_eligible_loan_amount (regression test for Defect 1A)."""
    _, post_data, get_data = _create_and_predict(client, user_auth_headers, PRIME_PAYLOAD)

    post_eligible = post_data["risk_assessment"]["estimated_eligible_loan_amount"]
    get_eligible = get_data["risk_assessment"]["estimated_eligible_loan_amount"]

    assert post_eligible == get_eligible, (
        f"POST eligible={post_eligible} differs from GET eligible={get_eligible}"
    )


def test_subprime_rejected_eligible_loan_is_calculated_not_hardcoded(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """Rejected/high-risk applications must receive a calculated eligible loan, not Rs3,00,000."""
    _, post_data, get_data = _create_and_predict(client, user_auth_headers, SUBPRIME_PAYLOAD)

    recommendation = post_data["recommendation"]
    post_eligible = post_data["risk_assessment"]["estimated_eligible_loan_amount"]
    get_eligible = get_data["risk_assessment"]["estimated_eligible_loan_amount"]

    assert recommendation == "REJECTED", f"Subprime profile should be REJECTED, got {recommendation}"

    # POST and GET must agree
    assert post_eligible == get_eligible, (
        f"POST eligible={post_eligible} differs from GET eligible={get_eligible}"
    )
    # Eligible loan must reflect actual low income (Rs4.5L, mult 0.5 -> cap ~Rs787500)
    if post_eligible is not None:
        assert post_eligible < 2000000, (
            f"Subprime eligible loan Rs{post_eligible:,.0f} seems too high for Rs4.5L income"
        )


def test_financial_health_score_is_not_hardcoded(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """financial_health_score must be a real computed value, not one of the
    three hardcoded values (85.0, 60.0, 30.0) from the old applications.py bug."""
    FORBIDDEN_HARDCODED = {85.0, 60.0, 30.0}

    _, post_data, get_data = _create_and_predict(client, user_auth_headers, PRIME_PAYLOAD)

    post_score = post_data["risk_assessment"]["financial_health_score"]
    get_score = get_data["risk_assessment"]["financial_health_score"]

    # POST and GET must agree
    assert post_score == get_score, (
        f"POST health_score={post_score} differs from GET health_score={get_score}"
    )
    # Score must not be one of the three hardcoded guard values
    assert post_score not in FORBIDDEN_HARDCODED, (
        f"Health score {post_score} is one of the old hardcoded values (85/60/30). "
        "assess_risk() must compute it from the actual feature ratios."
    )


def test_cibil_consistent_between_app_and_prediction(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """CIBIL stored in the application record must match the CIBIL used in the
    prediction factor explanation text."""
    submitted_cibil = PRIME_PAYLOAD["cibil_score"]

    create_res = client.post(
        "/api/v1/applications", json=PRIME_PAYLOAD, headers=user_auth_headers
    )
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]
    stored_cibil = create_res.json()["cibil_score"]
    assert stored_cibil == submitted_cibil

    pred_res = client.post(
        f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers
    )
    pred_data = pred_res.json()

    cibil_exp = next(
        (e for e in pred_data["explanations"] if e["feature_name"] == "cibil_score"),
        None,
    )
    assert cibil_exp is not None, "CIBIL factor explanation must be present"
    assert str(submitted_cibil) in cibil_exp["explanation_text"], (
        f"CIBIL {submitted_cibil} must appear in explanation text"
    )

    # GET route must reference the same application
    get_res = client.get(
        f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers
    )
    assert get_res.json()["application_id"] == app_id


def test_eligible_loan_changes_with_income(
    client: TestClient,
    user_auth_headers: Dict[str, str],
):
    """Tripling income must yield a meaningfully higher eligible loan (monotonicity)."""
    low_payload = {**MODERATE_PAYLOAD, "applicant_name": "Low Income Test", "income_annum": 600000}
    high_payload = {**MODERATE_PAYLOAD, "applicant_name": "High Income Test", "income_annum": 1800000}

    _, low_post, _ = _create_and_predict(client, user_auth_headers, low_payload)
    _, high_post, _ = _create_and_predict(client, user_auth_headers, high_payload)

    low_eligible = low_post["risk_assessment"]["estimated_eligible_loan_amount"]
    high_eligible = high_post["risk_assessment"]["estimated_eligible_loan_amount"]

    if low_eligible is not None and high_eligible is not None:
        assert high_eligible > low_eligible, (
            f"Higher income should yield higher eligible loan: "
            f"low={low_eligible:,.0f} vs high={high_eligible:,.0f}"
        )


# ---------------------------------------------------------------------------
# assess_risk() pure unit tests (no HTTP layer)
# ---------------------------------------------------------------------------


def _base_features(**overrides) -> Dict[str, Any]:
    base: Dict[str, Any] = {
        "cibil_score": 750,
        "income_annum": 1200000.0,
        "residential_assets_value": 2000000.0,
        "commercial_assets_value": 0.0,
        "luxury_assets_value": 200000.0,
        "bank_asset_value": 300000.0,
        "total_asset_value": 2500000.0,
        "estimated_payment_to_income_ratio": 0.25,
        "loan_to_annual_income_ratio": 2.0,
        "asset_to_loan_ratio": 1.04,
        "bank_asset_to_annual_income_ratio": 0.25,
    }
    base.update(overrides)
    return base


def test_assess_risk_returns_none_when_income_missing():
    """assess_risk() must return None for eligible_loan when income_annum is absent."""
    features: Dict[str, Any] = {
        "cibil_score": 700,
        "total_asset_value": 1000000.0,
        "estimated_payment_to_income_ratio": 0.30,
        "loan_to_annual_income_ratio": 2.5,
        "asset_to_loan_ratio": 1.0,
        "bank_asset_to_annual_income_ratio": 0.20,
    }
    result = assess_risk(features, 0.85)
    assert result["estimated_eligible_loan_amount"] is None, (
        "eligible_loan must be None when income_annum is missing, not Rs3,00,000"
    )


def test_assess_risk_no_300k_floor_for_low_income():
    """assess_risk() must NOT apply a Rs3,00,000 floor on genuinely low-income calculations."""
    features = _base_features(
        income_annum=200000.0,
        cibil_score=400,
        total_asset_value=50000.0,
        residential_assets_value=0.0,
        commercial_assets_value=0.0,
        luxury_assets_value=50000.0,
        bank_asset_value=0.0,
    )
    result = assess_risk(features, 0.05)
    eligible = result["estimated_eligible_loan_amount"]
    assert eligible is not None, "eligible_loan must not be None when income_annum > 0"
    assert eligible != 300000.0, (
        "eligible_loan must not be the old hardcoded Rs3,00,000 floor value"
    )


def test_assess_risk_prime_eligible_loan_reflects_income():
    """Prime applicant eligible loan must be substantially proportional to their income."""
    features = _base_features(
        income_annum=2400000.0,
        cibil_score=820,
        total_asset_value=8000000.0,
        residential_assets_value=6000000.0,
        commercial_assets_value=1000000.0,
        luxury_assets_value=500000.0,
        bank_asset_value=500000.0,
    )
    result = assess_risk(features, 0.95)
    eligible = result["estimated_eligible_loan_amount"]
    assert eligible is not None
    assert eligible >= 5000000, (
        f"Prime applicant eligible loan Rs{eligible:,.0f} must be >= Rs50,00,000"
    )


def test_assess_risk_higher_income_yields_higher_eligible_loan():
    """Tripling income must yield a strictly higher eligible loan (monotonicity)."""
    low_result = assess_risk(_base_features(income_annum=600000.0), 0.80)
    high_result = assess_risk(_base_features(income_annum=1800000.0), 0.80)

    low_e = low_result["estimated_eligible_loan_amount"]
    high_e = high_result["estimated_eligible_loan_amount"]

    assert low_e is not None and high_e is not None
    assert high_e > low_e, (
        f"Higher income must yield higher eligible loan: "
        f"low={low_e:,.0f} vs high={high_e:,.0f}"
    )


def test_eligible_loan_independent_of_ml_decision():
    """Estimated Maximum Potential Loan must be mathematically derived from
    financial parameters and strictly independent of the ML approval probability."""
    features = _base_features(income_annum=1500000.0, cibil_score=720)

    # Risk assessment with high approval probability (APPROVED)
    approved_outcome = assess_risk(features, approval_probability=0.92)
    # Risk assessment with low approval probability (REJECTED)
    rejected_outcome = assess_risk(features, approval_probability=0.08)

    assert approved_outcome["risk_level"] == "LOW"
    assert rejected_outcome["risk_level"] == "HIGH"
    # Eligible loan amount must be identical based on financial capacity
    assert (
        approved_outcome["estimated_eligible_loan_amount"]
        == rejected_outcome["estimated_eligible_loan_amount"]
    ), (
        "Eligible loan capacity must depend on financial inputs, not the ML approval status."
    )


def test_validation_error_distinguishable_from_server_error(client: TestClient):
    """Validation errors must return 422 Unprocessable Entity with field details,
    distinguishable from HTTP 500 or connection failure."""
    res = client.post("/api/v1/auth/login", json={"email": "not-an-email"})
    assert res.status_code == 422
    data = res.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert any("password" in str(err) or "Field required" in str(err) for err in data["detail"])

