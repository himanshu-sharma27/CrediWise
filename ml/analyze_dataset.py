"""CrediWiseAI - Comprehensive Exploratory Data Analysis (EDA) and Leakage Audit.

Performs distributional analysis, class breakdown, feature correlations,
binned approval rates, duplicate/leakage detection, and variance checks
on the processed Kaggle INR-native loan approval dataset.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, List

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROCESSED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "loan_approval_processed.csv"


def run_eda(data_path: Path = PROCESSED_DATA_PATH) -> Dict[str, Any]:
    """Executes a full exploratory data analysis on the processed dataset."""
    if not data_path.exists():
        raise FileNotFoundError(f"Processed dataset missing at: {data_path}")

    df = pd.read_csv(data_path)
    logger.info(f"Loaded processed dataset for EDA: {df.shape[0]} rows, {df.shape[1]} columns.")

    results: Dict[str, Any] = {}

    # 1. Target & Class Distribution
    target_counts = df["loan_approved"].value_counts().to_dict()
    target_proportions = (df["loan_approved"].value_counts(normalize=True) * 100).to_dict()
    results["target_distribution"] = {
        "counts": {str(k): int(v) for k, v in target_counts.items()},
        "percentages": {str(k): round(float(v), 2) for k, v in target_proportions.items()},
    }

    # 2. Duplicate & Near-Zero Variance Detection
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    results["near_zero_variance"] = {}
    for col in numeric_cols:
        var_val = float(df[col].var())
        if var_val < 1e-4:
            results["near_zero_variance"][col] = var_val

    # Check for identical duplicate numeric features
    results["duplicate_features"] = []
    for i, col1 in enumerate(numeric_cols):
        for col2 in numeric_cols[i + 1 :]:
            if np.allclose(df[col1], df[col2], rtol=1e-5, atol=1e-5):
                results["duplicate_features"].append((col1, col2))

    # 3. Numeric Summary
    results["numeric_summary"] = df[numeric_cols].describe().T[
        ["mean", "std", "min", "25%", "50%", "75%", "max"]
    ].to_dict(orient="index")

    # 4. Correlation with Target (loan_approved)
    corr_series = df[numeric_cols].corr()["loan_approved"].sort_values(ascending=False)
    results["target_correlations"] = {k: round(float(v), 4) for k, v in corr_series.items()}

    # 5. Approval Rates across Binned Segments
    # 5.1 CIBIL Score Bands
    cibil_bins = [300, 550, 650, 750, 900]
    cibil_labels = ["Poor (<550)", "Fair (550-649)", "Good (650-749)", "Excellent (750-900)"]
    df["cibil_band"] = pd.cut(df["cibil_score"], bins=cibil_bins, labels=cibil_labels, include_lowest=True)
    cibil_approval = df.groupby("cibil_band", observed=False)["loan_approved"].agg(["count", "mean"])
    results["approval_by_cibil"] = {
        idx: {"count": int(row["count"]), "approval_rate": round(float(row["mean"] * 100), 2)}
        for idx, row in cibil_approval.iterrows()
    }

    # 5.2 Income Bands (in Lakhs INR)
    income_bins = [0, 2500000, 5000000, 7500000, 10000000]
    income_labels = ["<= 25L", "25L - 50L", "50L - 75L", "> 75L"]
    df["income_band"] = pd.cut(df["income_annum"], bins=income_bins, labels=income_labels, include_lowest=True)
    income_approval = df.groupby("income_band", observed=False)["loan_approved"].agg(["count", "mean"])
    results["approval_by_income"] = {
        idx: {"count": int(row["count"]), "approval_rate": round(float(row["mean"] * 100), 2)}
        for idx, row in income_approval.iterrows()
    }

    # 5.3 Loan-to-Income Ratio Bands
    lti_bins = [0, 2.0, 3.0, 3.5, 5.0]
    lti_labels = ["Low (<=2.0x)", "Moderate (2.0-3.0x)", "High (3.0-3.5x)", "Very High (>3.5x)"]
    df["lti_band"] = pd.cut(df["loan_to_annual_income_ratio"], bins=lti_bins, labels=lti_labels, include_lowest=True)
    lti_approval = df.groupby("lti_band", observed=False)["loan_approved"].agg(["count", "mean"])
    results["approval_by_lti"] = {
        idx: {"count": int(row["count"]), "approval_rate": round(float(row["mean"] * 100), 2)}
        for idx, row in lti_approval.iterrows()
    }

    # 5.4 Categorical Approval Rates
    for cat_col in ["education", "self_employed"]:
        cat_approval = df.groupby(cat_col)["loan_approved"].agg(["count", "mean"])
        results[f"approval_by_{cat_col}"] = {
            idx: {"count": int(row["count"]), "approval_rate": round(float(row["mean"] * 100), 2)}
            for idx, row in cat_approval.iterrows()
        }

    # 6. Leakage Audit Check
    leakage_suspects = []
    for col, corr in results["target_correlations"].items():
        if col not in ["loan_approved"] and abs(corr) > 0.95:
            leakage_suspects.append((col, corr))
    results["leakage_suspects"] = leakage_suspects

    return results


def print_eda_report(results: Dict[str, Any]) -> None:
    """Prints a formatted terminal summary of the EDA."""
    print("\n========================================================")
    print("           CREDIWISE-AI EXPLORATORY DATA ANALYSIS        ")
    print("========================================================")
    print(f"\n1. Class Distribution:")
    for k, v in results["target_distribution"]["counts"].items():
        pct = results["target_distribution"]["percentages"][k]
        lbl = "Approved (1)" if k == "1" else "Rejected (0)"
        print(f"   - {lbl}: {v} records ({pct}%)")

    print(f"\n2. Duplicate Feature Pairs Detected:")
    if results["duplicate_features"]:
        for f1, f2 in results["duplicate_features"]:
            print(f"   - [DUPLICATE] '{f1}' is mathematically identical to '{f2}'")
    else:
        print("   - None detected.")

    print(f"\n3. Top Target Correlations (loan_approved):")
    for col, corr in list(results["target_correlations"].items())[:7]:
        print(f"   - {col:<35}: {corr:>+.4f}")

    print(f"\n4. Approval Rates by CIBIL Score Band:")
    for band, data in results["approval_by_cibil"].items():
        print(f"   - {band:<20}: {data['approval_rate']:>6.2f}% ({data['count']} applications)")

    print(f"\n5. Approval Rates by Categorical Groups:")
    for cat in ["education", "self_employed"]:
        print(f"   [{cat.upper()}]:")
        for group, data in results[f"approval_by_{cat}"].items():
            print(f"     * {group:<15}: {data['approval_rate']:>6.2f}% ({data['count']} applications)")

    print(f"\n6. Target Leakage Audit:")
    if results["leakage_suspects"]:
        print(f"   - [WARNING] Highly correlated features (|r| > 0.95): {results['leakage_suspects']}")
    else:
        print("   - [CLEAN] No perfect collinearity or direct target leakage detected.")
    print("========================================================\n")


if __name__ == "__main__":
    res = run_eda()
    print_eda_report(res)
