"""CrediWiseAI - Machine Learning Inference Service.

Single source of truth for loading the locked Kaggle INR-native model artifact
(loan-model-v2.0), computing deterministic engineered features, running inference,
and producing transparent factor explanations.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Feature definitions aligning strictly with ml/prepare_data.py & ml/train.py
ALLOWED_NUMERIC_FEATURES = [
    "no_of_dependents",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
    "residential_assets_value",
    "commercial_assets_value",
    "luxury_assets_value",
    "bank_asset_value",
    "monthly_income",
    "loan_to_annual_income_ratio",
    "loan_to_monthly_income_ratio",
    "total_asset_value",
    "asset_to_loan_ratio",
    "bank_asset_to_annual_income_ratio",
    "loan_term_months",
    "estimated_principal_monthly_payment",
    "estimated_payment_to_income_ratio",
]

ALLOWED_CATEGORICAL_FEATURES = [
    "education",
    "self_employed",
]

ALL_MODEL_FEATURES = ALLOWED_NUMERIC_FEATURES + ALLOWED_CATEGORICAL_FEATURES

_MODEL_BUNDLE: Optional[Dict[str, Any]] = None


def load_model_artifact(model_path: Optional[str] = None) -> Dict[str, Any]:
    """Loads the serialized model artifact into memory lazily and caches it."""
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is not None:
        return _MODEL_BUNDLE

    target_path = Path(model_path or settings.MODEL_PATH)
    if not target_path.exists():
        # Try fallback from project root
        project_root = Path(__file__).resolve().parents[3]
        fallback_path = project_root / "ml" / "models" / "loan_model_v2.joblib"
        if fallback_path.exists():
            target_path = fallback_path
        else:
            raise FileNotFoundError(
                f"Production ML model artifact not found at: {target_path}"
            )

    logger.info(f"Loading certified ML model artifact from: {target_path}")
    _MODEL_BUNDLE = joblib.load(target_path)
    logger.info(
        f"Model artifact loaded successfully: {_MODEL_BUNDLE.get('model_name')} "
        f"({_MODEL_BUNDLE.get('model_version')})"
    )
    return _MODEL_BUNDLE


def compute_deterministic_features(raw_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Computes all deterministic mathematical features in Indian Rupees (INR).

    Exact parity with ml/prepare_data.py:
    1. monthly_income = income_annum / 12.0
    2. loan_to_annual_income_ratio = loan_amount / income_annum
    3. loan_to_monthly_income_ratio = loan_amount / monthly_income
    4. total_asset_value = residential + commercial + luxury + bank
    5. asset_to_loan_ratio = total_asset_value / loan_amount
    6. bank_asset_to_annual_income_ratio = bank_asset_value / income_annum
    7. loan_term_months = loan_term * 12
    8. estimated_principal_monthly_payment = loan_amount / loan_term_months
    9. estimated_payment_to_income_ratio = estimated_principal_monthly_payment / monthly_income
    """
    income_annum = float(raw_dict["income_annum"])
    loan_amount = float(raw_dict["loan_amount"])
    loan_term = int(raw_dict["loan_term"])

    res_asset = float(raw_dict.get("residential_assets_value", 0.0))
    comm_asset = float(raw_dict.get("commercial_assets_value", 0.0))
    lux_asset = float(raw_dict.get("luxury_assets_value", 0.0))
    bank_asset = float(raw_dict.get("bank_asset_value", 0.0))

    monthly_income = income_annum / 12.0
    loan_to_annual_income_ratio = loan_amount / income_annum
    loan_to_monthly_income_ratio = loan_amount / monthly_income
    total_asset_value = res_asset + comm_asset + lux_asset + bank_asset
    asset_to_loan_ratio = total_asset_value / loan_amount
    bank_asset_to_annual_income_ratio = bank_asset / income_annum
    loan_term_months = loan_term * 12
    estimated_principal_monthly_payment = loan_amount / loan_term_months
    estimated_payment_to_income_ratio = (
        estimated_principal_monthly_payment / monthly_income
    )

    return {
        "no_of_dependents": int(raw_dict["no_of_dependents"]),
        "income_annum": income_annum,
        "loan_amount": loan_amount,
        "loan_term": loan_term,
        "cibil_score": int(raw_dict["cibil_score"]),
        "residential_assets_value": res_asset,
        "commercial_assets_value": comm_asset,
        "luxury_assets_value": lux_asset,
        "bank_asset_value": bank_asset,
        "monthly_income": monthly_income,
        "loan_to_annual_income_ratio": loan_to_annual_income_ratio,
        "loan_to_monthly_income_ratio": loan_to_monthly_income_ratio,
        "total_asset_value": total_asset_value,
        "asset_to_loan_ratio": asset_to_loan_ratio,
        "bank_asset_to_annual_income_ratio": bank_asset_to_annual_income_ratio,
        "loan_term_months": loan_term_months,
        "estimated_principal_monthly_payment": estimated_principal_monthly_payment,
        "estimated_payment_to_income_ratio": estimated_payment_to_income_ratio,
        "education": str(raw_dict["education"]).strip(),
        "self_employed": str(raw_dict["self_employed"]).strip(),
    }


def generate_factor_explanations(
    features: Dict[str, Any],
    approval_prob: float,
) -> List[Dict[str, Any]]:
    """Generates transparent, ranked positive and negative factor attributions.

    Combines global feature importance weights with applicant-specific thresholds.
    """
    cibil = features["cibil_score"]
    payment_ratio = features["estimated_payment_to_income_ratio"]
    loan_to_income = features["loan_to_annual_income_ratio"]
    asset_ratio = features["asset_to_loan_ratio"]
    bank_ratio = features["bank_asset_to_annual_income_ratio"]

    explanations: List[Dict[str, Any]] = []

    # 1. CIBIL Score (Global weight ~81%)
    if cibil >= 750:
        explanations.append({
            "feature_name": "cibil_score",
            "display_name": "Credit Bureau Score (CIBIL)",
            "impact": "POSITIVE",
            "direction": "INCREASES_APPROVAL",
            "rank": 1,
            "explanation_text": f"Prime credit score of {cibil} indicates exceptional creditworthiness and low historical default risk.",
        })
    elif cibil >= 650:
        explanations.append({
            "feature_name": "cibil_score",
            "display_name": "Credit Bureau Score (CIBIL)",
            "impact": "POSITIVE",
            "direction": "INCREASES_APPROVAL",
            "rank": 1,
            "explanation_text": f"Satisfactory credit score of {cibil} meets standard institutional lending criteria.",
        })
    elif cibil >= 550:
        explanations.append({
            "feature_name": "cibil_score",
            "display_name": "Credit Bureau Score (CIBIL)",
            "impact": "NEUTRAL",
            "direction": "DECREASES_APPROVAL",
            "rank": 1,
            "explanation_text": f"Fair credit score of {cibil} is borderline; secondary financial ratios determine the final outcome.",
        })
    else:
        explanations.append({
            "feature_name": "cibil_score",
            "display_name": "Credit Bureau Score (CIBIL)",
            "impact": "NEGATIVE",
            "direction": "DECREASES_APPROVAL",
            "rank": 1,
            "explanation_text": f"Sub-prime credit score of {cibil} significantly increases credit default risk.",
        })

    # 2. Estimated Payment to Income Ratio (Global weight ~11%)
    if payment_ratio <= 0.30:
        explanations.append({
            "feature_name": "estimated_payment_to_income_ratio",
            "display_name": "Monthly Debt Burden Ratio",
            "impact": "POSITIVE",
            "direction": "INCREASES_APPROVAL",
            "rank": 2,
            "explanation_text": f"Principal monthly repayment requires only {payment_ratio * 100:.1f}% of monthly income, ensuring comfortable cash flow.",
        })
    elif payment_ratio <= 0.50:
        explanations.append({
            "feature_name": "estimated_payment_to_income_ratio",
            "display_name": "Monthly Debt Burden Ratio",
            "impact": "NEUTRAL",
            "direction": "DECREASES_APPROVAL",
            "rank": 2,
            "explanation_text": f"Principal monthly repayment requires {payment_ratio * 100:.1f}% of monthly income, which is moderate.",
        })
    else:
        explanations.append({
            "feature_name": "estimated_payment_to_income_ratio",
            "display_name": "Monthly Debt Burden Ratio",
            "impact": "NEGATIVE",
            "direction": "DECREASES_APPROVAL",
            "rank": 2,
            "explanation_text": f"High debt burden: principal monthly repayment requires {payment_ratio * 100:.1f}% of monthly income.",
        })

    # 3. Loan to Annual Income Ratio (Global weight ~3.8%)
    if loan_to_income <= 2.5:
        explanations.append({
            "feature_name": "loan_to_annual_income_ratio",
            "display_name": "Loan to Annual Income Multiple",
            "impact": "POSITIVE",
            "direction": "INCREASES_APPROVAL",
            "rank": 3,
            "explanation_text": f"Requested loan is {loan_to_income:.2f}x annual income, reflecting conservative financial leverage.",
        })
    elif loan_to_income <= 3.5:
        explanations.append({
            "feature_name": "loan_to_annual_income_ratio",
            "display_name": "Loan to Annual Income Multiple",
            "impact": "NEUTRAL",
            "direction": "DECREASES_APPROVAL",
            "rank": 3,
            "explanation_text": f"Requested loan is {loan_to_income:.2f}x annual income, within acceptable borrowing bounds.",
        })
    else:
        explanations.append({
            "feature_name": "loan_to_annual_income_ratio",
            "display_name": "Loan to Annual Income Multiple",
            "impact": "NEGATIVE",
            "direction": "DECREASES_APPROVAL",
            "rank": 3,
            "explanation_text": f"Elevated borrowing leverage: requested loan represents {loan_to_income:.2f}x annual income.",
        })

    # 4. Asset Collateral Coverage Ratio (Global weight ~1.4%)
    if asset_ratio >= 2.0:
        explanations.append({
            "feature_name": "asset_to_loan_ratio",
            "display_name": "Asset Collateral Coverage",
            "impact": "POSITIVE",
            "direction": "INCREASES_APPROVAL",
            "rank": 4,
            "explanation_text": f"Total declared assets (₹{features['total_asset_value']:,.0f}) cover {asset_ratio:.2f}x the requested loan amount.",
        })
    elif asset_ratio >= 1.0:
        explanations.append({
            "feature_name": "asset_to_loan_ratio",
            "display_name": "Asset Collateral Coverage",
            "impact": "NEUTRAL",
            "direction": "INCREASES_APPROVAL",
            "rank": 4,
            "explanation_text": f"Declared assets cover {asset_ratio:.2f}x the requested loan amount.",
        })
    else:
        explanations.append({
            "feature_name": "asset_to_loan_ratio",
            "display_name": "Asset Collateral Coverage",
            "impact": "NEGATIVE",
            "direction": "DECREASES_APPROVAL",
            "rank": 4,
            "explanation_text": f"Inadequate collateral buffer: total declared assets cover only {asset_ratio:.2f}x the requested loan.",
        })

    # 5. Liquid Bank Reserves Ratio
    if bank_ratio >= 0.50:
        explanations.append({
            "feature_name": "bank_asset_to_annual_income_ratio",
            "display_name": "Liquid Bank Reserves Cushion",
            "impact": "POSITIVE",
            "direction": "INCREASES_APPROVAL",
            "rank": 5,
            "explanation_text": f"Liquid bank deposits equal {bank_ratio * 100:.1f}% of annual income, offering strong emergency liquidity.",
        })

    return explanations


def predict_loan_application(
    input_data: Dict[str, Any],
) -> Dict[str, Any]:
    """Single canonical ML inference execution for applications and simulator.

    Runs feature engineering, executes pipeline.predict_proba, derives recommendations,
    and measures latency.
    """
    bundle = load_model_artifact()
    pipeline = bundle["pipeline"]
    model_version = bundle.get("model_version", settings.MODEL_VERSION)

    # 1. Feature Engineering
    engineered = compute_deterministic_features(input_data)

    # 2. DataFrame Construction
    df_input = pd.DataFrame([engineered])[ALL_MODEL_FEATURES]

    # 3. Model Inference & Timing
    start_time = time.perf_counter()
    probabilities = pipeline.predict_proba(df_input)
    latency_ms = (time.perf_counter() - start_time) * 1000.0

    approval_prob = float(probabilities[0, 1])

    # 4. Canonical Recommendation (0.50 Threshold)
    recommendation = "APPROVED" if approval_prob >= 0.50 else "REJECTED"

    # Advisory Granular Recommendation
    if approval_prob >= 0.70:
        advisory_rec = "APPROVE"
        risk_level = "LOW"
    elif approval_prob >= 0.40:
        advisory_rec = "MANUAL_REVIEW"
        risk_level = "MEDIUM"
    else:
        advisory_rec = "REJECT"
        risk_level = "HIGH"

    # 5. Local Explanations
    explanations = generate_factor_explanations(engineered, approval_prob)

    return {
        "model_version": model_version,
        "recommendation": recommendation,
        "advisory_recommendation": advisory_rec,
        "approval_probability": round(approval_prob, 4),
        "risk_level": risk_level,
        "inference_latency_ms": round(latency_ms, 2),
        "derived_indicators": {
            "monthly_income": engineered["monthly_income"],
            "loan_to_annual_income_ratio": engineered["loan_to_annual_income_ratio"],
            "loan_to_monthly_income_ratio": engineered["loan_to_monthly_income_ratio"],
            "total_asset_value": engineered["total_asset_value"],
            "asset_to_loan_ratio": engineered["asset_to_loan_ratio"],
            "bank_asset_to_annual_income_ratio": engineered["bank_asset_to_annual_income_ratio"],
            "loan_term_months": engineered["loan_term_months"],
            "estimated_principal_monthly_payment": engineered["estimated_principal_monthly_payment"],
            "estimated_payment_to_income_ratio": engineered["estimated_payment_to_income_ratio"],
        },
        "explanations": explanations,
        "raw_features": engineered,
    }
