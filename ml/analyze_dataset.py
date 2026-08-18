"""CredWise - Exploratory Data Analysis for the replacement loan dataset.

Analyzes data/raw/loan_approval_dataset.csv by default and reports:
- schema and data quality
- target distribution
- zero-income rows
- known residential-asset placeholders
- numeric summaries/correlations
- approval rates by CIBIL, income and loan-to-income bands
- categorical approval rates
- duplicate/leakage checks
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "loan_approval_dataset.csv"
PROCESSED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "loan_approval_processed.csv"


def run_eda(data_path: Path = RAW_DATA_PATH) -> Dict[str, Any]:
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at: {data_path}")

    df = pd.read_csv(data_path)
    df.columns = df.columns.astype(str).str.strip()
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()

    logger.info("Loaded dataset: %d rows x %d columns", len(df), len(df.columns))

    results: Dict[str, Any] = {
        "shape": {"rows": int(len(df)), "columns": int(len(df.columns))},
        "columns": list(df.columns),
        "missing_values": {
            k: int(v) for k, v in df.isnull().sum().items() if v > 0
        },
        "duplicate_rows": int(df.duplicated().sum()),
        "duplicate_loan_ids": int(df["loan_id"].duplicated().sum()),
        "zero_income_rows": int((df["income_annum"] <= 0).sum()),
        "residential_placeholder_rows": int(
            (df["residential_assets_value"] == -100000).sum()
        ),
    }

    # Target distribution.
    counts = df["loan_status"].value_counts()
    props = df["loan_status"].value_counts(normalize=True) * 100
    results["target_distribution"] = {
        "counts": {str(k): int(v) for k, v in counts.items()},
        "percentages": {str(k): round(float(v), 2) for k, v in props.items()},
    }

    # Numeric summary and correlations after a temporary numeric target mapping.
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    results["numeric_summary"] = (
        df[numeric_cols]
        .describe()
        .T[["mean", "std", "min", "25%", "50%", "75%", "max"]]
        .to_dict(orient="index")
    )

    df["_loan_approved"] = df["loan_status"].map({"Approved": 1, "Rejected": 0})
    corr_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    results["target_correlations"] = {
        k: round(float(v), 4)
        for k, v in df[corr_cols].corr()["_loan_approved"].sort_values(
            ascending=False
        ).items()
    }

    # Approval rate by CIBIL.
    cibil_bins = [299, 550, 650, 750, 900]
    cibil_labels = ["<550", "550-649", "650-749", "750-900"]
    df["cibil_band"] = pd.cut(
        df["cibil_score"],
        bins=cibil_bins,
        labels=cibil_labels,
        include_lowest=True,
    )
    cibil_rates = df.groupby("cibil_band", observed=False)["_loan_approved"].agg(
        ["count", "mean"]
    )
    results["approval_by_cibil"] = {
        str(idx): {
            "count": int(row["count"]),
            "approval_rate": round(float(row["mean"] * 100), 2)
            if pd.notna(row["mean"])
            else None,
        }
        for idx, row in cibil_rates.iterrows()
    }

    # Approval rate by income.
    income_bins = [-1, 2500000, 5000000, 7500000, np.inf]
    income_labels = ["<=25L", "25L-50L", "50L-75L", ">75L"]
    df["income_band"] = pd.cut(
        df["income_annum"],
        bins=income_bins,
        labels=income_labels,
        include_lowest=True,
    )
    income_rates = df.groupby("income_band", observed=False)["_loan_approved"].agg(
        ["count", "mean"]
    )
    results["approval_by_income"] = {
        str(idx): {
            "count": int(row["count"]),
            "approval_rate": round(float(row["mean"] * 100), 2)
            if pd.notna(row["mean"])
            else None,
        }
        for idx, row in income_rates.iterrows()
    }

    # LTI is only meaningful for positive income.
    positive_income = df["income_annum"] > 0
    df["loan_to_income"] = np.nan
    df.loc[positive_income, "loan_to_income"] = (
        df.loc[positive_income, "loan_amount"]
        / df.loc[positive_income, "income_annum"]
    )
    lti_bins = [-np.inf, 2.0, 3.0, 3.5, np.inf]
    lti_labels = ["<=2.0x", "2.0-3.0x", "3.0-3.5x", ">3.5x"]
    df["lti_band"] = pd.cut(
        df["loan_to_income"],
        bins=lti_bins,
        labels=lti_labels,
        include_lowest=True,
    )
    lti_rates = df.groupby("lti_band", observed=False)["_loan_approved"].agg(
        ["count", "mean"]
    )
    results["approval_by_lti"] = {
        str(idx): {
            "count": int(row["count"]),
            "approval_rate": round(float(row["mean"] * 100), 2)
            if pd.notna(row["mean"])
            else None,
        }
        for idx, row in lti_rates.iterrows()
    }

    for cat_col in ["education", "self_employed"]:
        rates = df.groupby(cat_col)["_loan_approved"].agg(["count", "mean"])
        results[f"approval_by_{cat_col}"] = {
            str(idx): {
                "count": int(row["count"]),
                "approval_rate": round(float(row["mean"] * 100), 2),
            }
            for idx, row in rates.iterrows()
        }

    # Leakage audit: raw source features with very high correlation to target.
    leakage = []
    for col, corr in results["target_correlations"].items():
        if col != "_loan_approved" and abs(corr) > 0.95:
            leakage.append((col, corr))
    results["leakage_suspects"] = leakage

    return results


def print_eda_report(results: Dict[str, Any]) -> None:
    print("\n========================================================")
    print("              CREDWISE DATASET ANALYSIS")
    print("========================================================")
    shape = results["shape"]
    print(f"\nDataset size: {shape['rows']} rows x {shape['columns']} columns")
    print(f"Duplicate rows: {results['duplicate_rows']}")
    print(f"Duplicate loan IDs: {results['duplicate_loan_ids']}")
    print(f"Zero-income rows: {results['zero_income_rows']}")
    print(
        "Residential -100000 placeholders: "
        f"{results['residential_placeholder_rows']}"
    )

    print("\n1. Target Distribution")
    for k, v in results["target_distribution"]["counts"].items():
        pct = results["target_distribution"]["percentages"][k]
        print(f"   - {k:<10}: {v:>5} ({pct:>6.2f}%)")

    print("\n2. Top Target Correlations")
    for col, corr in list(results["target_correlations"].items())[:8]:
        print(f"   - {col:<35}: {corr:+.4f}")

    print("\n3. Approval by CIBIL")
    for band, data in results["approval_by_cibil"].items():
        rate = data["approval_rate"]
        print(f"   - {band:<10}: {rate if rate is not None else 'N/A':>6}% ({data['count']})")

    print("\n4. Approval by Income")
    for band, data in results["approval_by_income"].items():
        rate = data["approval_rate"]
        print(f"   - {band:<10}: {rate if rate is not None else 'N/A':>6}% ({data['count']})")

    print("\n5. Approval by Education")
    for group, data in results["approval_by_education"].items():
        print(f"   - {group:<15}: {data['approval_rate']:>6.2f}% ({data['count']})")

    print("\n6. Approval by Self Employment")
    for group, data in results["approval_by_self_employed"].items():
        print(f"   - {group:<15}: {data['approval_rate']:>6.2f}% ({data['count']})")

    print("\n7. Leakage Audit")
    if results["leakage_suspects"]:
        print(f"   - WARNING: {results['leakage_suspects']}")
    else:
        print("   - CLEAN: no |r| > 0.95 raw-feature correlation detected.")

    if results["missing_values"]:
        print(f"\n8. Missing Values: {results['missing_values']}")
    else:
        print("\n8. Missing Values: none")

    print("========================================================\n")


if __name__ == "__main__":
    print_eda_report(run_eda())