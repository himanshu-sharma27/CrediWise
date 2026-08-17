"""CrediWise - Administrator, Analytics, and Model Monitoring Endpoints.

Provides administrative dashboard KPIs, user directory management, portfolio analytics,
and lightweight ML telemetry strictly protected by require_admin RBAC guards.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.app.api.applications import format_application_response
from backend.app.api.deps import require_admin
from backend.app.models.models import AuditLog, LoanApplication, PredictionResult, User
from backend.app.db.session import get_db
from backend.app.schemas.schemas import (
    AdminAnalyticsResponse,
    AdminDashboardResponse,
    AdminMonitoringResponse,
    AdminUsersListResponse,
    AdminUserSummary,
)
from backend.app.services.ml_service import load_model_artifact

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Administrator"])


@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
    summary="Executive dashboard KPIs and recent applications",
)
def get_admin_dashboard(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDashboardResponse:
    """Returns top-level KPI metrics and recent applications for executive overview."""
    apps = (
        db.query(LoanApplication)
        .options(joinedload(LoanApplication.predictions).joinedload(PredictionResult.explanations))
        .order_by(LoanApplication.created_at.desc())
        .all()
    )

    total_apps = len(apps)
    approved_count = 0
    rejected_count = 0
    under_review_count = 0
    total_requested_loan = 0.0
    total_cibil = 0

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    status_dist = {"APPROVED": 0, "REJECTED": 0, "UNDER_REVIEW": 0}

    for app in apps:
        total_requested_loan += float(app.loan_amount)
        total_cibil += int(app.cibil_score)

        st = app.status or "UNDER_REVIEW"
        if st == "APPROVED":
            approved_count += 1
            status_dist["APPROVED"] += 1
        elif st == "REJECTED":
            rejected_count += 1
            status_dist["REJECTED"] += 1
        else:
            under_review_count += 1
            status_dist["UNDER_REVIEW"] += 1

        # Check prediction risk level
        if app.predictions:
            latest_pred = max(app.predictions, key=lambda p: p.created_at)
            rk = latest_pred.risk_level or "MEDIUM"
            if rk in risk_dist:
                risk_dist[rk] += 1

    avg_loan = total_requested_loan / total_apps if total_apps > 0 else 0.0
    avg_cibil = total_cibil / total_apps if total_apps > 0 else 0.0
    approval_rate = (approved_count / total_apps * 100.0) if total_apps > 0 else 0.0

    recent_formatted = [format_application_response(app) for app in apps[:10]]

    return AdminDashboardResponse(
        total_applications=total_apps,
        approved_applications=approved_count,
        rejected_applications=rejected_count,
        under_review_applications=under_review_count,
        approval_rate=round(approval_rate, 1),
        total_requested_loan_amount=round(total_requested_loan, 2),
        average_loan_amount=round(avg_loan, 2),
        average_cibil_score=round(avg_cibil, 1),
        risk_distribution=risk_dist,
        status_distribution=status_dist,
        recent_applications=recent_formatted,
    )


@router.get(
    "/users",
    response_model=AdminUsersListResponse,
    summary="List all registered platform users",
)
def get_admin_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUsersListResponse:
    """Returns directory of registered users with application counts. Never exposes secrets."""
    users = db.query(User).order_by(User.created_at.desc()).all()

    # Pre-aggregate application counts per user
    app_counts = (
        db.query(LoanApplication.user_id, func.count(LoanApplication.id))
        .group_by(LoanApplication.user_id)
        .all()
    )
    app_count_map = {uid: count for uid, count in app_counts}

    user_summaries = [
        AdminUserSummary(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            application_count=app_count_map.get(u.id, 0),
        )
        for u in users
    ]

    return AdminUsersListResponse(
        total=len(user_summaries),
        users=user_summaries,
    )


@router.get(
    "/analytics",
    response_model=AdminAnalyticsResponse,
    summary="Portfolio risk, demographic, and financial distribution analytics",
)
def get_admin_analytics(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminAnalyticsResponse:
    """Aggregates demographic, credit bureau, and volume analytics from persisted database records."""
    apps = (
        db.query(LoanApplication)
        .options(joinedload(LoanApplication.predictions))
        .all()
    )

    total_apps = len(apps)
    approved_count = 0
    rejected_count = 0
    under_review_count = 0
    total_loan_volume = 0.0
    total_asset_volume = 0.0

    cibil_bands = {
        "300-599 (Subprime)": 0,
        "600-699 (Fair)": 0,
        "700-749 (Good)": 0,
        "750-900 (Prime)": 0,
    }

    loan_amount_bands = {
        "< 10 Lakhs": 0,
        "10L - 25 Lakhs": 0,
        "25L - 50 Lakhs": 0,
        "> 50 Lakhs": 0,
    }

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    education_dist = {"Graduate": 0, "Not Graduate": 0}
    employment_dist = {"Salaried": 0, "Self-Employed": 0}

    for app in apps:
        loan_val = float(app.loan_amount)
        total_loan_volume += loan_val

        asset_val = (
            float(app.residential_assets_value)
            + float(app.commercial_assets_value)
            + float(app.luxury_assets_value)
            + float(app.bank_asset_value)
        )
        total_asset_volume += asset_val

        # Status
        st = app.status or "UNDER_REVIEW"
        if st == "APPROVED":
            approved_count += 1
        elif st == "REJECTED":
            rejected_count += 1
        else:
            under_review_count += 1

        # CIBIL Band
        c = app.cibil_score
        if c < 600:
            cibil_bands["300-599 (Subprime)"] += 1
        elif c < 700:
            cibil_bands["600-699 (Fair)"] += 1
        elif c < 750:
            cibil_bands["700-749 (Good)"] += 1
        else:
            cibil_bands["750-900 (Prime)"] += 1

        # Loan Amount Band
        if loan_val < 1000000:
            loan_amount_bands["< 10 Lakhs"] += 1
        elif loan_val <= 2500000:
            loan_amount_bands["10L - 25 Lakhs"] += 1
        elif loan_val <= 5000000:
            loan_amount_bands["25L - 50 Lakhs"] += 1
        else:
            loan_amount_bands["> 50 Lakhs"] += 1

        # Categoricals
        if app.education == "Graduate":
            education_dist["Graduate"] += 1
        else:
            education_dist["Not Graduate"] += 1

        if app.self_employed == "Yes":
            employment_dist["Self-Employed"] += 1
        else:
            employment_dist["Salaried"] += 1

        # Risk level from latest prediction
        if app.predictions:
            latest_pred = max(app.predictions, key=lambda p: p.created_at)
            rk = latest_pred.risk_level or "MEDIUM"
            if rk in risk_dist:
                risk_dist[rk] += 1

    approval_rate = (approved_count / total_apps * 100.0) if total_apps > 0 else 0.0
    rejection_rate = (rejected_count / total_apps * 100.0) if total_apps > 0 else 0.0

    return AdminAnalyticsResponse(
        total_applications=total_apps,
        approved_count=approved_count,
        rejected_count=rejected_count,
        under_review_count=under_review_count,
        approval_rate=round(approval_rate, 1),
        rejection_rate=round(rejection_rate, 1),
        cibil_bands=cibil_bands,
        loan_amount_bands=loan_amount_bands,
        risk_distribution=risk_dist,
        education_distribution=education_dist,
        employment_distribution=employment_dist,
        total_loan_volume=round(total_loan_volume, 2),
        total_asset_volume=round(total_asset_volume, 2),
    )


@router.get(
    "/monitoring",
    response_model=AdminMonitoringResponse,
    summary="ML Model metadata, inference telemetry, and performance metrics",
)
def get_model_monitoring(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminMonitoringResponse:
    """Returns certified model metadata, training metrics, and live inference tracking."""
    bundle = load_model_artifact()

    # Query DB prediction records for live telemetry
    preds = db.query(PredictionResult).order_by(PredictionResult.created_at.desc()).all()
    total_preds = len(preds)

    total_latency = sum(p.inference_latency_ms for p in preds) if preds else 0.0
    avg_latency = total_latency / total_preds if total_preds > 0 else 0.0

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    rec_dist = {"APPROVED": 0, "REJECTED": 0}

    recent_preds: List[Dict[str, Any]] = []
    for p in preds[:10]:
        recent_preds.append({
            "id": p.id,
            "application_id": p.application_id,
            "recommendation": p.recommendation,
            "approval_probability": p.approval_probability,
            "risk_level": p.risk_level,
            "inference_latency_ms": p.inference_latency_ms,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
        if p.risk_level in risk_dist:
            risk_dist[p.risk_level] += 1
        if p.recommendation in rec_dist:
            rec_dist[p.recommendation] += 1

    # Extract training metrics and feature importances
    training_metrics = bundle.get("metrics", {})
    raw_feature_importances = bundle.get("feature_importances", {})
    # Format feature importances to clean float dict (supports both dict and list-of-tuples)
    feature_importance: Dict[str, float] = {}
    parsed_items: List[tuple[str, float]] = []

    if isinstance(raw_feature_importances, dict):
        for k, v in raw_feature_importances.items():
            try:
                parsed_items.append((str(k), float(v)))
            except (ValueError, TypeError):
                pass
    elif isinstance(raw_feature_importances, (list, tuple)):
        for item in raw_feature_importances:
            try:
                if isinstance(item, (list, tuple)) and len(item) == 2:
                    parsed_items.append((str(item[0]), float(item[1])))
                elif isinstance(item, dict) and "feature" in item and "importance" in item:
                    parsed_items.append((str(item["feature"]), float(item["importance"])))
            except (ValueError, TypeError):
                pass

    # Sort descending by importance score
    parsed_items.sort(key=lambda x: x[1], reverse=True)

    # Top 10 limit
    for k, v in parsed_items[:10]:
        feature_importance[k] = round(v, 4)

    all_models_test_metrics = bundle.get("all_models_test_metrics", {})
    all_models_cv_metrics = bundle.get("all_models_cv_metrics", {})
    candidate_models = list(all_models_test_metrics.keys()) if all_models_test_metrics else [
        "Logistic Regression",
        "Decision Tree",
        "Random Forest",
        "Gradient Boosting",
    ]

    return AdminMonitoringResponse(
        model_version=bundle.get("model_version", "loan-model-v2.0"),
        algorithm=bundle.get("model_name", "Gradient Boosting"),
        status="ACTIVE",
        total_predictions=total_preds,
        average_latency_ms=round(avg_latency, 2),
        risk_distribution=risk_dist,
        recommendation_distribution=rec_dist,
        training_metrics=training_metrics,
        feature_importance=feature_importance,
        recent_predictions=recent_preds,
        all_models_test_metrics=all_models_test_metrics,
        all_models_cv_metrics=all_models_cv_metrics,
        candidate_models=candidate_models,
        champion_model=bundle.get("model_name", "Gradient Boosting"),
        champion_version=bundle.get("model_version", "loan-model-v2.0"),
    )
