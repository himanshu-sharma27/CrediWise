"""CrediWiseAI - Prediction & What-If Simulator API Endpoints.

Provides automated ML prediction for stored loan applications, prediction persistence,
status updating, prediction history, and real-time What-If scenario simulation.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session, joinedload

from backend.app.api.deps import get_current_user, require_user
from backend.app.db.session import get_db
from backend.app.models.models import AuditLog, LoanApplication, PredictionExplanation, PredictionResult, User
from backend.app.schemas.schemas import (
    DerivedIndicatorsSchema,
    FactorExplanationSchema,
    PredictionHistoryItem,
    PredictionResponse,
    RiskAssessmentSchema,
    SimulatorRequestSchema,
    SimulatorResponseSchema,
)
from backend.app.services.assessment_report import generate_assessment_pdf
from backend.app.services.ml_service import predict_loan_application
from backend.app.services.risk_engine import assess_risk

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post(
    "/applications/{app_id}",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate and persist ML prediction for a loan application",
)
def generate_application_prediction(
    app_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Runs the certified Kaggle ML model pipeline for an existing loan application.

    Persists the prediction result and updates the application status to APPROVED or REJECTED.
    """
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan application with ID {app_id} not found.",
        )

    # Ownership / Admin verification
    if current_user.role != "admin" and app.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you cannot trigger prediction for another user's application.",
        )

    # 1. Build ML input from stored fields
    raw_input = {
        "no_of_dependents": app.no_of_dependents,
        "education": app.education,
        "self_employed": app.self_employed,
        "income_annum": app.income_annum,
        "loan_amount": app.loan_amount,
        "loan_term": app.loan_term,
        "cibil_score": app.cibil_score,
        "residential_assets_value": app.residential_assets_value,
        "commercial_assets_value": app.commercial_assets_value,
        "luxury_assets_value": app.luxury_assets_value,
        "bank_asset_value": app.bank_asset_value,
    }

    # 2. Execute canonical ML inference
    pred_data = predict_loan_application(raw_input)
    derived = pred_data["derived_indicators"]

    # 3. Execute Risk Assessment
    risk_data = assess_risk(pred_data["raw_features"], pred_data["approval_probability"])

    # 4. Persist Prediction Result
    pred_record = PredictionResult(
        application_id=app.id,
        model_version=pred_data["model_version"],
        recommendation=pred_data["recommendation"],
        approval_probability=pred_data["approval_probability"],
        risk_level=risk_data["risk_level"],
        inference_latency_ms=pred_data["inference_latency_ms"],
        monthly_income=derived["monthly_income"],
        loan_to_annual_income_ratio=derived["loan_to_annual_income_ratio"],
        loan_to_monthly_income_ratio=derived["loan_to_monthly_income_ratio"],
        total_asset_value=derived["total_asset_value"],
        asset_to_loan_ratio=derived["asset_to_loan_ratio"],
        bank_asset_to_annual_income_ratio=derived["bank_asset_to_annual_income_ratio"],
        estimated_principal_monthly_payment=derived["estimated_principal_monthly_payment"],
        estimated_payment_to_income_ratio=derived["estimated_payment_to_income_ratio"],
    )
    db.add(pred_record)
    db.flush()  # Obtain pred_record.id

    # 5. Persist Factor Explanations
    explanation_schemas: List[FactorExplanationSchema] = []
    for exp in pred_data["explanations"]:
        exp_record = PredictionExplanation(
            prediction_id=pred_record.id,
            feature_name=exp["feature_name"],
            display_name=exp["display_name"],
            impact=exp["impact"],
            direction=exp["direction"],
            rank=exp["rank"],
            explanation_text=exp["explanation_text"],
        )
        db.add(exp_record)
        explanation_schemas.append(FactorExplanationSchema(**exp))

    # 6. Update Application Status to match Recommendation
    app.status = pred_data["recommendation"]

    # 7. Create Audit Log
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=current_user.id,
        action="PREDICTION_GENERATE",
        details=(
            f"Generated prediction for application {app.application_number}: "
            f"{pred_data['recommendation']} ({pred_data['approval_probability'] * 100:.1f}%)"
        ),
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()
    db.refresh(pred_record)

    return PredictionResponse(
        id=pred_record.id,
        application_id=app.id,
        model_version=pred_record.model_version,
        recommendation=pred_record.recommendation,
        advisory_recommendation=pred_data["advisory_recommendation"],
        approval_probability=pred_record.approval_probability,
        risk_level=pred_record.risk_level,
        inference_latency_ms=pred_record.inference_latency_ms,
        derived_indicators=DerivedIndicatorsSchema(**derived),
        risk_assessment=RiskAssessmentSchema(**risk_data),
        explanations=explanation_schemas,
        created_at=pred_record.created_at,
    )


@router.get(
    "/applications/{app_id}",
    response_model=PredictionResponse,
    summary="Retrieve latest prediction for a loan application",
)
def get_latest_application_prediction(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Returns the most recent prediction generated for the given application."""
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan application with ID {app_id} not found.",
        )

    if current_user.role != "admin" and app.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this prediction.",
        )

    pred = (
        db.query(PredictionResult)
        .options(joinedload(PredictionResult.explanations))
        .filter(PredictionResult.application_id == app_id)
        .order_by(PredictionResult.created_at.desc(), PredictionResult.id.desc())
        .first()
    )

    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prediction has been generated for this application yet.",
        )

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
        loan_term_months=app.loan_term * 12,
        estimated_principal_monthly_payment=pred.estimated_principal_monthly_payment,
        estimated_payment_to_income_ratio=pred.estimated_payment_to_income_ratio,
    )

    risk_assess = assess_risk(
        {
            # Source-of-truth application parameters (always present on app record)
            "income_annum": app.income_annum,
            "residential_assets_value": app.residential_assets_value,
            "commercial_assets_value": app.commercial_assets_value,
            "luxury_assets_value": app.luxury_assets_value,
            "bank_asset_value": app.bank_asset_value,
            # Persisted derived ratios (calculated at prediction time)
            "cibil_score": app.cibil_score,
            "total_asset_value": pred.total_asset_value,
            "estimated_payment_to_income_ratio": pred.estimated_payment_to_income_ratio,
            "loan_to_annual_income_ratio": pred.loan_to_annual_income_ratio,
            "asset_to_loan_ratio": pred.asset_to_loan_ratio,
            "bank_asset_to_annual_income_ratio": pred.bank_asset_to_annual_income_ratio,
        },
        pred.approval_probability,
    )

    return PredictionResponse(
        id=pred.id,
        application_id=app.id,
        model_version=pred.model_version,
        recommendation=pred.recommendation,
        advisory_recommendation=pred.recommendation,
        approval_probability=pred.approval_probability,
        risk_level=pred.risk_level,
        inference_latency_ms=pred.inference_latency_ms,
        derived_indicators=derived,
        risk_assessment=RiskAssessmentSchema(**risk_assess),
        explanations=explanations,
        created_at=pred.created_at,
    )


@router.get(
    "/applications/{app_id}/assessment-report",
    summary="Download formal PDF assessment report for a loan application",
)
def download_application_assessment_report(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Generates and returns an authoritative PDF assessment report.

    Enforces ownership check: applicant can only download their own application.
    """
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan application with ID {app_id} not found.",
        )

    if current_user.role != "admin" and app.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you cannot download assessment for another user's application.",
        )

    pred = (
        db.query(PredictionResult)
        .options(joinedload(PredictionResult.explanations))
        .filter(PredictionResult.application_id == app_id)
        .order_by(PredictionResult.created_at.desc(), PredictionResult.id.desc())
        .first()
    )

    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessment prediction has been generated for this application yet.",
        )

    risk_assess = assess_risk(
        {
            "income_annum": app.income_annum,
            "residential_assets_value": app.residential_assets_value,
            "commercial_assets_value": app.commercial_assets_value,
            "luxury_assets_value": app.luxury_assets_value,
            "bank_asset_value": app.bank_asset_value,
            "cibil_score": app.cibil_score,
            "total_asset_value": pred.total_asset_value,
            "estimated_payment_to_income_ratio": pred.estimated_payment_to_income_ratio,
            "loan_to_annual_income_ratio": pred.loan_to_annual_income_ratio,
            "asset_to_loan_ratio": pred.asset_to_loan_ratio,
            "bank_asset_to_annual_income_ratio": pred.bank_asset_to_annual_income_ratio,
        },
        pred.approval_probability,
    )

    pdf_bytes = generate_assessment_pdf(app, pred, risk_assess)

    filename = f"CrediWise_Assessment_{app.application_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/me",
    response_model=List[PredictionHistoryItem],
    summary="Retrieve prediction history for current user's applications",
)
def get_my_predictions_history(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> List[PredictionHistoryItem]:
    """Retrieves all predictions generated for applications owned by the user."""
    preds = (
        db.query(PredictionResult)
        .join(LoanApplication, PredictionResult.application_id == LoanApplication.id)
        .filter(LoanApplication.user_id == current_user.id)
        .order_by(PredictionResult.created_at.desc(), PredictionResult.id.desc())
        .all()
    )

    return [PredictionHistoryItem.model_validate(p) for p in preds]


@router.post(
    "/simulator",
    response_model=SimulatorResponseSchema,
    summary="Execute real-time What-If scenario simulation",
)
@router.post(
    "/simulate",
    response_model=SimulatorResponseSchema,
    summary="Execute real-time What-If scenario simulation (alias)",
)
def run_what_if_simulator(
    payload: SimulatorRequestSchema,
) -> SimulatorResponseSchema:
    """Executes the exact same ML inference and risk engine pipeline on what-if parameters

    without persisting fake database records.
    """
    raw_dict = payload.model_dump()

    # 1. Execute identical ML prediction service
    pred_data = predict_loan_application(raw_dict)
    derived = pred_data["derived_indicators"]

    # 2. Execute identical Risk engine
    risk_data = assess_risk(pred_data["raw_features"], pred_data["approval_probability"])

    explanations = [FactorExplanationSchema(**exp) for exp in pred_data["explanations"]]

    return SimulatorResponseSchema(
        model_version=pred_data["model_version"],
        recommendation=pred_data["recommendation"],
        advisory_recommendation=pred_data["advisory_recommendation"],
        approval_probability=pred_data["approval_probability"],
        risk_level=risk_data["risk_level"],
        inference_latency_ms=pred_data["inference_latency_ms"],
        derived_indicators=DerivedIndicatorsSchema(**derived),
        risk_assessment=RiskAssessmentSchema(**risk_data),
        explanations=explanations,
        input_summary={
            "cibil_score": payload.cibil_score,
            "income_annum": payload.income_annum,
            "loan_amount": payload.loan_amount,
            "loan_term": payload.loan_term,
            "total_assets": derived["total_asset_value"],
        },
    )
