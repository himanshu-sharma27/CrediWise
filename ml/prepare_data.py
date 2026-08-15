"""CrediWiseAI - ML Data Validation, Anomaly Recovery, and Feature Engineering Pipeline.

Single canonical source of truth for offline data validation and deterministic
feature engineering for the Kaggle INR-native Loan Approval dataset.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Canonical Schema & Feature Definitions
EXPECTED_SOURCE_COLUMNS = [
    "loan_id",
    "no_of_dependents",
    "education",
    "self_employed",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
    "residential_assets_value",
    "commercial_assets_value",
    "luxury_assets_value",
    "bank_asset_value",
    "loan_status",
]

SOURCE_FEATURES = [
    "no_of_dependents",
    "education",
    "self_employed",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
    "residential_assets_value",
    "commercial_assets_value",
    "luxury_assets_value",
    "bank_asset_value",
]

ENGINEERED_FEATURES = [
    "monthly_income",
    "loan_to_annual_income_ratio",
    "loan_to_monthly_income_ratio",
    "total_asset_value",
    "asset_to_loan_ratio",
    "bank_asset_to_annual_income_ratio",
    "asset_coverage_ratio",
    "loan_term_months",
    "estimated_principal_monthly_payment",
    "estimated_payment_to_income_ratio",
]

TARGET_COLUMN = "loan_approved"
SOURCE_TARGET_COLUMN = "loan_status"
TARGET_MAPPING = {"Approved": 1, "Rejected": 0}

VALID_CATEGORICALS = {
    "education": {"Graduate", "Not Graduate"},
    "self_employed": {"Yes", "No"},
    "loan_status": {"Approved", "Rejected"},
}

KNOWN_RESIDENTIAL_ASSET_ANOMALY = -100000


def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Strips leading and trailing whitespace from column names."""
    df = df.copy()
    df.columns = df.columns.astype(str).str.strip()
    return df


def clean_string_values(df: pd.DataFrame) -> pd.DataFrame:
    """Strips leading and trailing whitespace from string/categorical values."""
    df = df.copy()
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()
    return df


def validate_dataset(
    data_source: str | Path | pd.DataFrame,
) -> Tuple[bool, Dict[str, Any], pd.DataFrame]:
    """Validates the raw Kaggle dataset against strict schema, category, null,

    and financial value boundaries.
    """
    if isinstance(data_source, (str, Path)):
        path = Path(data_source)
        if not path.exists():
            raise FileNotFoundError(f"Source dataset not found at: {path}")
        df = pd.read_csv(path)
    elif isinstance(data_source, pd.DataFrame):
        df = data_source.copy()
    else:
        raise TypeError(f"Unsupported data_source type: {type(data_source)}")

    # 1. Clean column headers and string values
    df = clean_column_names(df)
    df = clean_string_values(df)

    report: Dict[str, Any] = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "missing_values": {},
        "duplicate_rows": 0,
        "duplicate_loan_ids": 0,
        "known_anomalies": {},
        "errors": [],
    }

    # 2. Check required columns
    missing_cols = set(EXPECTED_SOURCE_COLUMNS) - set(df.columns)
    if missing_cols:
        err = f"Missing required columns in dataset: {missing_cols}"
        report["errors"].append(err)
        raise ValueError(err)

    # 3. Check for duplicates
    dup_rows = int(df.duplicated().sum())
    dup_ids = int(df["loan_id"].duplicated().sum())
    report["duplicate_rows"] = dup_rows
    report["duplicate_loan_ids"] = dup_ids

    if dup_rows > 0:
        report["errors"].append(f"Found {dup_rows} duplicate rows.")
    if dup_ids > 0:
        report["errors"].append(f"Found {dup_ids} duplicate loan_id values.")

    # 4. Check for Nulls / NaNs / Infs
    null_counts = df[EXPECTED_SOURCE_COLUMNS].isnull().sum().to_dict()
    report["missing_values"] = {k: int(v) for k, v in null_counts.items() if v > 0}
    if any(v > 0 for v in null_counts.values()):
        report["errors"].append(f"Null values detected: {report['missing_values']}")

    # 5. Check Categoricals
    for cat_col, valid_values in VALID_CATEGORICALS.items():
        unique_vals = set(df[cat_col].unique())
        invalid_vals = unique_vals - valid_values
        if invalid_vals:
            err = f"Invalid categorical values in {cat_col}: {invalid_vals}. Allowed: {valid_values}"
            report["errors"].append(err)

    # 6. Check Numeric Ranges & Financial Scaling
    if (df["cibil_score"] < 300).any() or (df["cibil_score"] > 900).any():
        report["errors"].append("CIBIL scores out of range [300, 900].")

    if (df["income_annum"] <= 0).any():
        report["errors"].append("Found non-positive annual income values.")

    if (df["loan_amount"] <= 0).any():
        report["errors"].append("Found non-positive loan amount values.")

    if (df["loan_term"] <= 0).any() or (df["loan_term"] > 40).any():
        report["errors"].append("Loan term out of valid range (1-40 years).")

    if (df["no_of_dependents"] < 0).any():
        report["errors"].append("Found negative no_of_dependents values.")

    # Asset non-negativity checks
    for asset_col in ["commercial_assets_value", "luxury_assets_value", "bank_asset_value"]:
        negs = (df[asset_col] < 0).sum()
        if negs > 0:
            report["errors"].append(f"Found {negs} unexpected negative values in {asset_col}.")

    # Special check for residential_assets_value known anomaly
    res_negs = df[df["residential_assets_value"] < 0]["residential_assets_value"]
    if len(res_negs) > 0:
        unique_res_negs = set(res_negs.unique())
        if unique_res_negs == {KNOWN_RESIDENTIAL_ASSET_ANOMALY}:
            report["known_anomalies"]["residential_assets_value"] = {
                "count": len(res_negs),
                "value": KNOWN_RESIDENTIAL_ASSET_ANOMALY,
                "action": "recoverable_placeholder_replace_with_zero",
            }
            logger.info(
                f"Identified {len(res_negs)} rows with known residential asset placeholder anomaly ({KNOWN_RESIDENTIAL_ASSET_ANOMALY})."
            )
        else:
            unexpected = unique_res_negs - {KNOWN_RESIDENTIAL_ASSET_ANOMALY}
            err = f"Unexpected negative values in residential_assets_value: {unexpected}"
            report["errors"].append(err)

    is_valid = len(report["errors"]) == 0
    if not is_valid:
        raise ValueError(f"Dataset validation failed with errors: {report['errors']}")

    logger.info("Dataset validation passed successfully.")
    return is_valid, report, df


def handle_known_anomalies(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    """Corrects known dataset placeholder anomalies deterministically.

    Replaces residential_assets_value == -100000 with 0.
    """
    df = df.copy()
    anomaly_mask = df["residential_assets_value"] == KNOWN_RESIDENTIAL_ASSET_ANOMALY
    correction_count = int(anomaly_mask.sum())
    if correction_count > 0:
        df.loc[anomaly_mask, "residential_assets_value"] = 0
        logger.info(
            f"Handled known anomaly: Replaced {correction_count} instances of {KNOWN_RESIDENTIAL_ASSET_ANOMALY} with 0 in residential_assets_value."
        )
    return df, correction_count


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes all deterministic mathematical features derived from raw features.

    Formulas:
    1. monthly_income = income_annum / 12
    2. loan_to_annual_income_ratio = loan_amount / income_annum
    3. loan_to_monthly_income_ratio = loan_amount / monthly_income
    4. total_asset_value = residential + commercial + luxury + bank
    5. asset_to_loan_ratio = total_asset_value / loan_amount
    6. bank_asset_to_annual_income_ratio = bank_asset_value / income_annum
    7. asset_coverage_ratio = total_asset_value / loan_amount
    8. loan_term_months = loan_term * 12
    9. estimated_principal_monthly_payment = loan_amount / loan_term_months
    10. estimated_payment_to_income_ratio = estimated_principal_monthly_payment / monthly_income
    """
    df = df.copy()

    # 1. Monthly Income
    df["monthly_income"] = df["income_annum"] / 12.0

    # 2. Loan to Annual Income Ratio
    df["loan_to_annual_income_ratio"] = df["loan_amount"] / df["income_annum"]

    # 3. Loan to Monthly Income Ratio
    df["loan_to_monthly_income_ratio"] = df["loan_amount"] / df["monthly_income"]

    # 4. Total Asset Value
    df["total_asset_value"] = (
        df["residential_assets_value"]
        + df["commercial_assets_value"]
        + df["luxury_assets_value"]
        + df["bank_asset_value"]
    )

    # 5. Asset to Loan Ratio
    df["asset_to_loan_ratio"] = df["total_asset_value"] / df["loan_amount"]

    # 6. Bank Asset to Annual Income Ratio
    df["bank_asset_to_annual_income_ratio"] = df["bank_asset_value"] / df["income_annum"]

    # 7. Asset Coverage Ratio
    df["asset_coverage_ratio"] = df["total_asset_value"] / df["loan_amount"]

    # 8. Loan Term in Months
    df["loan_term_months"] = df["loan_term"] * 12

    # 9. Estimated Principal Monthly Payment (Principal proxy, not bank EMI)
    df["estimated_principal_monthly_payment"] = df["loan_amount"] / df["loan_term_months"]

    # 10. Estimated Payment to Monthly Income Ratio
    df["estimated_payment_to_income_ratio"] = (
        df["estimated_principal_monthly_payment"] / df["monthly_income"]
    )

    return df


def prepare_dataset(
    input_path: str | Path,
    output_path: str | Path | None = None,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Validates raw dataset, corrects known anomalies, engineers features,

    maps target variable, and exports the clean processed dataset.
    """
    input_path = Path(input_path)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found at: {input_path}")

    # 1. Validate raw data
    is_valid, validation_report, df = validate_dataset(input_path)
    if not is_valid:
        raise ValueError(f"Raw data validation failed: {validation_report['errors']}")

    # 2. Correct known anomaly
    df, anomaly_corrections = handle_known_anomalies(df)

    # 3. Apply Feature Engineering
    df = engineer_features(df)

    # 4. Target Variable Encoding
    if SOURCE_TARGET_COLUMN in df.columns:
        df[TARGET_COLUMN] = df[SOURCE_TARGET_COLUMN].map(TARGET_MAPPING)
        if df[TARGET_COLUMN].isnull().any():
            raise ValueError("Target encoding produced unmapped null values.")

    # 5. Quality verification on processed dataset
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if df[numeric_cols].isnull().any().any():
        raise ValueError("Processed dataframe contains null values in numeric columns.")

    if np.isinf(df[numeric_cols].to_numpy()).any():
        raise ValueError("Processed dataframe contains infinite values.")

    summary: Dict[str, Any] = {
        "raw_rows": validation_report["total_rows"],
        "processed_rows": len(df),
        "total_columns": len(df.columns),
        "source_features": SOURCE_FEATURES,
        "engineered_features": ENGINEERED_FEATURES,
        "target_column": TARGET_COLUMN,
        "anomaly_corrections": anomaly_corrections,
        "target_distribution": df[TARGET_COLUMN].value_counts().to_dict()
        if TARGET_COLUMN in df.columns
        else {},
    }

    # 6. Save processed dataset if output path provided
    if output_path is not None:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_p, index=False)
        logger.info(f"Processed dataset saved successfully to: {out_p}")

    return df, summary


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parents[1]
    raw_path = base_dir / "data" / "raw" / "loan_approval_dataset.csv"
    processed_path = base_dir / "data" / "processed" / "loan_approval_processed.csv"

    if not raw_path.exists():
        raw_path = Path("data/raw/loan_approval_dataset.csv")
        processed_path = Path("data/processed/loan_approval_processed.csv")

    logger.info("Executing CrediWiseAI Canonical Data Preparation Pipeline...")
    proc_df, rep = prepare_dataset(raw_path, processed_path)
    print("\n================ DATA PREPARATION SUMMARY ================")
    print(f"Total Processed Records : {rep['processed_rows']}")
    print(f"Total Columns           : {rep['total_columns']}")
    print(f"Anomalies Corrected     : {rep['anomaly_corrections']}")
    print(f"Target Distribution     : {rep['target_distribution']}")
    print("==========================================================\n")
