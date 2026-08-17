"""CrediWiseAI - Assessment Report PDF & Email API Tests.

Validates PDF generation, authentication, RBAC ownership enforcement,
and SMTP error handling for assessment reports.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.app.models.models import LoanApplication, User
from backend.app.services.assessment_report import generate_assessment_pdf


def test_generate_assessment_pdf_structure(db_session, test_user, valid_application_payload):
    """Verifies that generate_assessment_pdf produces valid non-empty PDF bytes."""
    app = LoanApplication(
        user_id=test_user.id,
        application_number="CW-TEST-123456",
        **valid_application_payload,
    )
    db_session.add(app)
    db_session.commit()
    db_session.refresh(app)

    # Mock prediction record
    mock_prediction = MagicMock()
    mock_prediction.model_version = "loan-model-v2.0"
    mock_prediction.recommendation = "APPROVED"
    mock_prediction.approval_probability = 0.885
    mock_prediction.risk_level = "LOW"
    mock_prediction.monthly_income = 100000.0
    mock_prediction.estimated_principal_monthly_payment = 16666.67
    mock_prediction.estimated_payment_to_income_ratio = 0.1667
    mock_prediction.total_asset_value = 7500000.0
    mock_prediction.asset_to_loan_ratio = 2.5
    mock_prediction.loan_to_annual_income_ratio = 2.5
    mock_prediction.explanations = []

    risk_assess = {
        "risk_level": "LOW",
        "financial_health_score": 88.0,
        "summary": "Excellent financial profile.",
        "estimated_eligible_loan_amount": 4500000.0,
        "positive_factors": ["High CIBIL score"],
        "risk_factors": [],
    }

    pdf_bytes = generate_assessment_pdf(app, mock_prediction, risk_assess)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF-")


def test_download_assessment_report_success(client: TestClient, user_auth_headers, valid_application_payload):
    """Authenticated user can download their own assessment PDF report."""
    # 1. Create application
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    assert create_resp.status_code == 201
    app_id = create_resp.json()["id"]

    # 2. Trigger prediction
    pred_resp = client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)
    assert pred_resp.status_code == 200

    # 3. Download report
    report_resp = client.get(f"/api/v1/predictions/applications/{app_id}/assessment-report", headers=user_auth_headers)
    assert report_resp.status_code == 200
    assert report_resp.headers["content-type"] == "application/pdf"
    assert "attachment" in report_resp.headers.get("content-disposition", "")
    assert report_resp.content.startswith(b"%PDF-")


def test_download_assessment_report_forbidden_for_other_user(
    client: TestClient, user_auth_headers, other_user_auth_headers, valid_application_payload
):
    """User B cannot download User A's assessment PDF."""
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    assert create_resp.status_code == 201
    app_id = create_resp.json()["id"]

    # Trigger prediction by owner
    client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)

    # Attempt download by another user
    report_resp = client.get(f"/api/v1/predictions/applications/{app_id}/assessment-report", headers=other_user_auth_headers)
    assert report_resp.status_code == 403
    assert "forbidden" in report_resp.json()["detail"].lower()


def test_download_assessment_report_unauthorized(client: TestClient, user_auth_headers, valid_application_payload):
    """Unauthenticated download request is rejected."""
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_resp.json()["id"]

    report_resp = client.get(f"/api/v1/predictions/applications/{app_id}/assessment-report")
    assert report_resp.status_code == 401


def test_download_assessment_report_admin_allowed(
    client: TestClient, user_auth_headers, admin_auth_headers, valid_application_payload
):
    """Admin can download any user's assessment PDF report."""
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_resp.json()["id"]

    # Trigger prediction
    client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)

    # Admin downloads
    report_resp = client.get(f"/api/v1/predictions/applications/{app_id}/assessment-report", headers=admin_auth_headers)
    assert report_resp.status_code == 200
    assert report_resp.headers["content-type"] == "application/pdf"
    assert report_resp.content.startswith(b"%PDF-")


def test_email_assessment_report_unauthorized(client: TestClient, user_auth_headers, valid_application_payload):
    """Unauthenticated email request is rejected."""
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_resp.json()["id"]

    email_resp = client.post(f"/api/v1/predictions/applications/{app_id}/assessment-report/email")
    assert email_resp.status_code == 401


def test_email_assessment_report_forbidden_for_other_user(
    client: TestClient, user_auth_headers, other_user_auth_headers, valid_application_payload
):
    """User B cannot dispatch User A's assessment email."""
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_resp.json()["id"]
    client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)

    email_resp = client.post(
        f"/api/v1/predictions/applications/{app_id}/assessment-report/email",
        headers=other_user_auth_headers,
    )
    assert email_resp.status_code == 403


def test_email_assessment_report_missing_smtp_returns_clean_error(
    client: TestClient, user_auth_headers, valid_application_payload
):
    """When SMTP is unconfigured, returns clean user-friendly 503 error."""
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_resp.json()["id"]
    client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)

    with patch("backend.app.services.assessment_report.settings.SMTP_HOST", None):
        email_resp = client.post(
            f"/api/v1/predictions/applications/{app_id}/assessment-report/email",
            headers=user_auth_headers,
        )
        assert email_resp.status_code == 503
        assert "Unable to send the assessment email right now" in email_resp.json()["detail"]


def test_email_assessment_report_dispatches_to_auth_user_only(
    client: TestClient, user_auth_headers, test_user: User, valid_application_payload
):
    """Email is sent strictly to the authenticated user's registered address."""
    create_resp = client.post("/api/v1/applications", json=valid_application_payload, headers=user_auth_headers)
    app_id = create_resp.json()["id"]
    client.post(f"/api/v1/predictions/applications/{app_id}", headers=user_auth_headers)

    with patch("backend.app.services.assessment_report.settings.SMTP_HOST", "smtp.example.com"), \
         patch("backend.app.services.assessment_report.smtplib.SMTP") as mock_smtp_cls:
        mock_smtp_inst = MagicMock()
        mock_smtp_cls.return_value = mock_smtp_inst

        email_resp = client.post(
            f"/api/v1/predictions/applications/{app_id}/assessment-report/email",
            headers=user_auth_headers,
        )
        assert email_resp.status_code == 200
        data = email_resp.json()
        assert data["email"] == test_user.email
        assert mock_smtp_inst.sendmail.called
        # Check recipient is test_user.email
        args = mock_smtp_inst.sendmail.call_args[0]
        assert test_user.email in args[1]
