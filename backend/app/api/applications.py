"""CrediWiseAI - Loan Application API Endpoints.

Handles application creation, applicant listing, ownership validation, and admin oversight.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from backend.app.api.deps import get_current_user, require_admin, require_user
from backend.app.db.session import get_db
from backend.app.models.models import AuditLog, LoanApplication, PredictionResult, User
from backend.app.schemas.schemas import (
    DerivedIndicatorsSchema,
    FactorExplanationSchema,
    LoanApplicationCreateRequest,
    LoanApplicationListResponse,
    LoanApplicationResponse,
    PredictionResponse,
    RiskAssessmentSchema,
)
from backend.app.services.risk_engine import assess_risk

router = APIRouter(prefix="/applications", tags=["Applications"])


def generate_application_number() -> str:
    """Generates a human-readable unique application identifier."""
    now = datetime.now(timezone.utc)
    short_uuid = uuid.uuid4().hex[:8].upper()
    return f"APP-{now.strftime('%Y%m')}-{short_uuid}"


def build_prediction_response_schema(
    pred: Optional[PredictionResult],
    app: Optional[LoanApplication] = None,
) -> Optional[PredictionResponse]:
    """Helper to convert a PredictionResult DB model to PredictionResponse schema.

    Accepts the parent LoanApplication so that income and asset values are available
    for the deterministic eligible-loan calculation inside assess_risk().
    """
    if not pred:
        return None

    explanations = [
        FactorExplanationSchema(
            feature_name=exp.feature_name,
            display_name=exp.display_name,
            impact=exp.impact,
            direction=exp.direction,
            rank=exp.rank,
            explanation_text=exp.explanation_text,
        )
        for exp in pred.explanations
    ]

    derived = DerivedIndicatorsSchema(
        monthly_income=pred.monthly_income,
        loan_to_annual_income_ratio=pred.loan_to_annual_income_ratio,
        loan_to_monthly_income_ratio=pred.loan_to_monthly_income_ratio,
        total_asset_value=pred.total_asset_value,
        asset_to_loan_ratio=pred.asset_to_loan_ratio,
        bank_asset_to_annual_income_ratio=pred.bank_asset_to_annual_income_ratio,
        loan_term_months=int(pred.loan_to_monthly_income_ratio / (pred.loan_to_annual_income_ratio / 12))
        if pred.loan_to_annual_income_ratio > 0
        else 60,
        estimated_principal_monthly_payment=pred.estimated_principal_monthly_payment,
        estimated_payment_to_income_ratio=pred.estimated_payment_to_income_ratio,
    )

    # Build the full feature dict for assess_risk().
    # Include application-level values when available so the eligible loan
    # calculation has income and asset data (not just ratio fields).
    risk_features: dict = {
        "cibil_score": app.cibil_score if app else 300,
        "total_asset_value": pred.total_asset_value,
        "estimated_payment_to_income_ratio": pred.estimated_payment_to_income_ratio,
        "loan_to_annual_income_ratio": pred.loan_to_annual_income_ratio,
        "asset_to_loan_ratio": pred.asset_to_loan_ratio,
        "bank_asset_to_annual_income_ratio": pred.bank_asset_to_annual_income_ratio,
    }
    if app is not None:
        risk_features.update({
            "income_annum": app.income_annum,
            "residential_assets_value": app.residential_assets_value,
            "commercial_assets_value": app.commercial_assets_value,
            "luxury_assets_value": app.luxury_assets_value,
            "bank_asset_value": app.bank_asset_value,
        })

    risk_assess_dict = assess_risk(risk_features, pred.approval_probability)

    return PredictionResponse(
        id=pred.id,
        application_id=pred.application_id,
        model_version=pred.model_version,
        recommendation=pred.recommendation,
        advisory_recommendation=pred.recommendation,
        approval_probability=pred.approval_probability,
        risk_level=pred.risk_level,
        inference_latency_ms=pred.inference_latency_ms,
        derived_indicators=derived,
        risk_assessment=RiskAssessmentSchema(**risk_assess_dict),
        explanations=explanations,
        created_at=pred.created_at,
    )


def format_application_response(app: LoanApplication) -> LoanApplicationResponse:
    """Formats a LoanApplication database entity to LoanApplicationResponse."""
    latest_pred = app.predictions[0] if app.predictions else None
    # Pass the application record so build_prediction_response_schema() can access
    # income_annum and asset fields for the deterministic eligible-loan calculation.
    pred_schema = build_prediction_response_schema(latest_pred, app)

    return LoanApplicationResponse(
        id=app.id,
        application_number=app.application_number,
        user_id=app.user_id,
        applicant_name=app.applicant_name,
        no_of_dependents=app.no_of_dependents,
        education=app.education,
        self_employed=app.self_employed,
        income_annum=app.income_annum,
        loan_amount=app.loan_amount,
        loan_term=app.loan_term,
        cibil_score=app.cibil_score,
        residential_assets_value=app.residential_assets_value,
        commercial_assets_value=app.commercial_assets_value,
        luxury_assets_value=app.luxury_assets_value,
        bank_asset_value=app.bank_asset_value,
        status=app.status,
        created_at=app.created_at,
        updated_at=app.updated_at,
        latest_prediction=pred_schema,
    )


@router.post(
    "",
    response_model=LoanApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new loan application",
)
def create_application(
    payload: LoanApplicationCreateRequest,
    request: Request,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> LoanApplicationResponse:
    """Creates a new loan application strictly associated with the authenticated user."""
    app_number = generate_application_number()

    app_record = LoanApplication(
        application_number=app_number,
        user_id=current_user.id,  # Guaranteed server-side ownership from JWT
        applicant_name=payload.applicant_name.strip(),
        no_of_dependents=payload.no_of_dependents,
        education=payload.education,
        self_employed=payload.self_employed,
        income_annum=payload.income_annum,
        loan_amount=payload.loan_amount,
        loan_term=payload.loan_term,
        cibil_score=payload.cibil_score,
        residential_assets_value=payload.residential_assets_value,
        commercial_assets_value=payload.commercial_assets_value,
        luxury_assets_value=payload.luxury_assets_value,
        bank_asset_value=payload.bank_asset_value,
        status="UNDER_REVIEW",
    )

    db.add(app_record)
    db.commit()
    db.refresh(app_record)

    # Create Audit Log
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=current_user.id,
        action="APPLICATION_CREATE",
        details=f"Created application {app_record.application_number} for ₹{app_record.loan_amount:,.0f}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    return format_application_response(app_record)


@router.get(
    "/me",
    response_model=LoanApplicationListResponse,
    summary="List current user's loan applications",
)
def get_my_applications(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> LoanApplicationListResponse:
    """Retrieves all loan applications owned by the currently authenticated user."""
    apps = (
        db.query(LoanApplication)
        .options(joinedload(LoanApplication.predictions).joinedload(PredictionResult.explanations))
        .filter(LoanApplication.user_id == current_user.id)
        .order_by(LoanApplication.created_at.desc(), LoanApplication.id.desc())
        .all()
    )

    formatted = [format_application_response(app) for app in apps]
    return LoanApplicationListResponse(total=len(formatted), applications=formatted)


@router.get(
    "/{app_id}",
    response_model=LoanApplicationResponse,
    summary="Retrieve a specific loan application by ID",
)
def get_application_by_id(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LoanApplicationResponse:
    """Retrieves a single loan application.

    Enforces ownership isolation: regular users can only access their own applications.
    Administrators can access any application.
    """
    app = (
        db.query(LoanApplication)
        .options(joinedload(LoanApplication.predictions).joinedload(PredictionResult.explanations))
        .filter(LoanApplication.id == app_id)
        .first()
    )

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan application with ID {app_id} not found.",
        )

    # RBAC & Ownership check
    if current_user.role != "admin" and app.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this application.",
        )

    return format_application_response(app)


@router.get(
    "",
    response_model=LoanApplicationListResponse,
    summary="List all applications across all users (Admin only)",
)
def list_all_applications_admin(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> LoanApplicationListResponse:
    """Administrator endpoint to retrieve all submitted applications."""
    apps = (
        db.query(LoanApplication)
        .options(joinedload(LoanApplication.predictions).joinedload(PredictionResult.explanations))
        .order_by(LoanApplication.created_at.desc(), LoanApplication.id.desc())
        .all()
    )

    formatted = [format_application_response(app) for app in apps]
    return LoanApplicationListResponse(total=len(formatted), applications=formatted)
