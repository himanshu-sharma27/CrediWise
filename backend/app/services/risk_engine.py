"""CrediWiseAI - Risk Assessment and Financial Health Engine.

Evaluates multi-dimensional risk signals, composite financial health scoring,
and actionable risk breakdown without modifying underlying ML model probabilities.
"""

from __future__ import annotations

from typing import Any, Dict, List


def assess_risk(
    features: Dict[str, Any],
    approval_probability: float,
) -> Dict[str, Any]:
    """Computes comprehensive risk metrics, health scores, and factor breakdowns."""
    cibil = int(features["cibil_score"])
    payment_ratio = float(features["estimated_payment_to_income_ratio"])
    loan_to_income = float(features["loan_to_annual_income_ratio"])
    asset_to_loan = float(features["asset_to_loan_ratio"])
    bank_to_income = float(features["bank_asset_to_annual_income_ratio"])

    # 1. Credit Strength
    if cibil >= 750:
        credit_strength = "Prime Credit (Exceptional)"
        credit_score_pts = 40.0
    elif cibil >= 700:
        credit_strength = "Good Credit (Low Risk)"
        credit_score_pts = 35.0
    elif cibil >= 650:
        credit_strength = "Fair Credit (Moderate Risk)"
        credit_score_pts = 25.0
    elif cibil >= 550:
        credit_strength = "Borderline Credit (Elevated Risk)"
        credit_score_pts = 15.0
    else:
        credit_strength = "Sub-Prime Credit (High Risk)"
        credit_score_pts = 5.0

    # 2. Repayment Capacity
    if payment_ratio <= 0.25:
        repayment_capacity = "Strong (Low Burden <= 25%)"
        repayment_pts = 30.0
    elif payment_ratio <= 0.40:
        repayment_capacity = "Adequate (Moderate Burden <= 40%)"
        repayment_pts = 22.0
    elif payment_ratio <= 0.55:
        repayment_capacity = "Strained (Elevated Burden <= 55%)"
        repayment_pts = 12.0
    else:
        repayment_capacity = "Critical (Severe Burden > 55%)"
        repayment_pts = 4.0

    # 3. Asset Coverage
    if asset_to_loan >= 2.0:
        asset_coverage = "High (Asset Backing >= 200%)"
        asset_pts = 20.0
    elif asset_to_loan >= 1.0:
        asset_coverage = "Adequate (Asset Backing >= 100%)"
        asset_pts = 14.0
    elif asset_to_loan >= 0.5:
        asset_coverage = "Moderate (Asset Backing >= 50%)"
        asset_pts = 8.0
    else:
        asset_coverage = "Inadequate (Asset Backing < 50%)"
        asset_pts = 2.0

    # 4. Liquidity Cushion
    if bank_to_income >= 0.40:
        liquidity_pts = 10.0
    elif bank_to_income >= 0.15:
        liquidity_pts = 6.0
    else:
        liquidity_pts = 2.0

    # Total Financial Health Score (0 - 100)
    health_score = round(credit_score_pts + repayment_pts + asset_pts + liquidity_pts, 1)

    # Risk Level Determination (Aligned with ML Probability Bounds)
    if approval_probability >= 0.70 and cibil >= 650:
        risk_level = "LOW"
    elif approval_probability < 0.40 or cibil < 550 or payment_ratio > 0.60:
        risk_level = "HIGH"
    else:
        risk_level = "MEDIUM"

    # Positive and Risk Factors
    positive_factors: List[str] = []
    risk_factors: List[str] = []

    if cibil >= 700:
        positive_factors.append(f"Strong CIBIL score ({cibil}) indicates reliable repayment history.")
    else:
        risk_factors.append(f"CIBIL score ({cibil}) is below prime underwriting benchmark.")

    if payment_ratio <= 0.35:
        positive_factors.append(f"Comfortable monthly debt burden ({payment_ratio * 100:.1f}% of income).")
    else:
        risk_factors.append(f"Elevated debt-to-income burden ({payment_ratio * 100:.1f}% of monthly income).")

    if asset_to_loan >= 1.5:
        positive_factors.append(f"Robust asset collateral ({asset_to_loan:.1f}x coverage).")
    elif asset_to_loan < 1.0:
        risk_factors.append(f"Asset collateral ({asset_to_loan:.2f}x) is below loan amount.")

    if loan_to_income <= 2.5:
        positive_factors.append(f"Conservative borrowing leverage ({loan_to_income:.1f}x annual income).")
    else:
        risk_factors.append(f"High borrowing leverage ({loan_to_income:.1f}x annual income).")

    # 5. Estimated Maximum Potentially Eligible Loan Amount (INR)
    # Resolve total_asset_value from pre-computed field or sum of individual categories.
    # Individual asset fields are included when called directly from the ML pipeline (raw_features dict);
    # the pre-computed total_asset_value field is used when called from the GET endpoint with ratios.
    total_assets_from_components = (
        float(features.get("residential_assets_value", 0.0))
        + float(features.get("commercial_assets_value", 0.0))
        + float(features.get("luxury_assets_value", 0.0))
        + float(features.get("bank_asset_value", 0.0))
    )
    total_assets_precomputed = float(features.get("total_asset_value", 0.0))
    # Prefer the sum of components when available (non-zero); fall back to precomputed total.
    total_assets = total_assets_from_components if total_assets_from_components > 0 else total_assets_precomputed

    income_val = float(features.get("income_annum", 0.0))

    # CIBIL-adjusted income multiplier: prime applicants can borrow more relative to income.
    cibil_mult = 1.25 if cibil >= 750 else (1.0 if cibil >= 700 else (0.8 if cibil >= 650 else 0.5))

    if income_val > 0:
        # Affordability ceiling: (annual_income × 3.5) adjusted by CIBIL tier
        income_cap = income_val * 3.5 * cibil_mult
        # Collateral ceiling: 70% of total pledgeable assets, minimum 2× annual income
        collateral_cap = max(total_assets * 0.70, income_val * 2.0)
        # Eligible amount = tighter of affordability cap and collateral cap
        raw_eligible = min(income_cap, collateral_cap)
        # Round to nearest ₹50,000 for presentation; cap at Kaggle dataset max (₹3.95 Cr).
        # No hard lower-floor: if the formula yields a genuinely low amount, report it accurately.
        eligible_amount: float | None = min(39500000.0, round(raw_eligible / 50000.0) * 50000.0)
    else:
        # Cannot calculate without income data; return None so callers can display "Unavailable".
        eligible_amount = None

    # Summary
    if risk_level == "LOW":
        summary = "Favorable credit profile with strong repayment capacity and solid collateral cushion."
    elif risk_level == "MEDIUM":
        summary = "Moderate risk profile requiring balanced evaluation of cash flow and debt obligations."
    else:
        summary = "High risk profile due to credit score thresholds, debt burden, or insufficient collateral."

    return {
        "risk_level": risk_level,
        "credit_strength": credit_strength,
        "repayment_capacity": repayment_capacity,
        "asset_coverage": asset_coverage,
        "financial_health_score": health_score,
        "summary": summary,
        "positive_factors": positive_factors,
        "risk_factors": risk_factors,
        "estimated_eligible_loan_amount": eligible_amount,
    }
