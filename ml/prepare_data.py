"""CredWise - Data validation and deterministic feature engineering.

Updated for loan_approval_dataset_10000_synthetic.csv.

Important dataset-specific handling:
- The raw CSV contains 10,000 rows.
- 3 rows have income_annum == 0. They are retained in the raw CSV but excluded
  from the processed training dataset because income-based engineered features
  require a positive denominator.
- 28 residential_assets_value entries use the known -100000 placeholder and are
  converted to 0 during processing.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, Tuple

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

EXPECTED_SOURCE_COLUMNS = [
    "loan_id", "no_of_dependents", "education", "self_employed",
    "income_annum", "loan_amount", "loan_term", "cibil_score",
    "residential_assets_value", "commercial_assets_value",
    "luxury_assets_value", "bank_asset_value", "loan_status",
]

SOURCE_FEATURES = [
    "no_of_dependents", "education", "self_employed", "income_annum",
    "loan_amount", "loan_term", "cibil_score",
    "residential_assets_value", "commercial_assets_value",
    "luxury_assets_value", "bank_asset_value",
]

ENGINEERED_FEATURES = [
    "monthly_income", "loan_to_annual_income_ratio",
    "loan_to_monthly_income_ratio", "total_asset_value",
    "asset_to_loan_ratio", "bank_asset_to_annual_income_ratio",
    "asset_coverage_ratio", "loan_term_months",
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
    df = df.copy()
    df.columns = df.columns.astype(str).str.strip()
    return df


def clean_string_values(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()
    return df


def load_raw_dataset(data_source: str | Path | pd.DataFrame) -> pd.DataFrame:
    if isinstance(data_source, (str, Path)):
        path = Path(data_source)
        if not path.exists():
            raise FileNotFoundError(f"Source dataset not found at: {path}")
        df = pd.read_csv(path)
    elif isinstance(data_source, pd.DataFrame):
        df = data_source.copy()
    else:
        raise TypeError(f"Unsupported data_source type: {type(data_source)}")
    return clean_string_values(clean_column_names(df))


def validate_dataset(
    data_source: str | Path | pd.DataFrame,
) -> Tuple[bool, Dict[str, Any], pd.DataFrame]:
    """Validate the new dataset without rejecting its 3 zero-income rows.

    Zero-income rows are a known dataset issue for this version and are excluded
    by remove_non_trainable_rows() before feature engineering.
    """
    df = load_raw_dataset(data_source)

    report: Dict[str, Any] = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "missing_values": {},
        "duplicate_rows": int(df.duplicated().sum()),
        "duplicate_loan_ids": int(df["loan_id"].duplicated().sum()),
        "zero_income_rows": int((df["income_annum"] <= 0).sum()),
        "known_anomalies": {},
        "errors": [],
    }

    missing_cols = set(EXPECTED_SOURCE_COLUMNS) - set(df.columns)
    if missing_cols:
        report["errors"].append(f"Missing required columns: {sorted(missing_cols)}")

    null_counts = df[EXPECTED_SOURCE_COLUMNS].isnull().sum()
    report["missing_values"] = {k: int(v) for k, v in null_counts.items() if v > 0}
    if report["missing_values"]:
        report["errors"].append(f"Null values detected: {report['missing_values']}")

    if report["duplicate_rows"] > 0:
        report["errors"].append(f"Found {report['duplicate_rows']} duplicate rows.")
    if report["duplicate_loan_ids"] > 0:
        report["errors"].append(f"Found {report['duplicate_loan_ids']} duplicate loan_id values.")

    for cat_col, valid_values in VALID_CATEGORICALS.items():
        actual = set(df[cat_col].dropna().unique())
        invalid = actual - valid_values
        if invalid:
            report["errors"].append(
                f"Invalid categorical values in {cat_col}: {sorted(invalid)}"
            )

    if ((df["cibil_score"] < 300) | (df["cibil_score"] > 900)).any():
        report["errors"].append("CIBIL scores must be in [300, 900].")
    if (df["loan_amount"] <= 0).any():
        report["errors"].append("loan_amount must be positive.")
    if ((df["loan_term"] <= 0) | (df["loan_term"] > 40)).any():
        report["errors"].append("loan_term must be in (0, 40].")
    if (df["no_of_dependents"] < 0).any():
        report["errors"].append("no_of_dependents cannot be negative.")

    for col in ["commercial_assets_value", "luxury_assets_value", "bank_asset_value"]:
        if (df[col] < 0).any():
            report["errors"].append(f"{col} contains unexpected negative values.")

    residential_neg = df.loc[df["residential_assets_value"] < 0, "residential_assets_value"]
    if len(residential_neg):
        if set(residential_neg.unique()) == {KNOWN_RESIDENTIAL_ASSET_ANOMALY}:
            report["known_anomalies"]["residential_assets_value"] = {
                "count": int(len(residential_neg)),
                "value": KNOWN_RESIDENTIAL_ASSET_ANOMALY,
                "action": "replace_with_zero",
            }
        else:
            report["errors"].append(
                "Unexpected negative residential_assets_value values: "
                f"{sorted(set(residential_neg.unique()))}"
            )

    if report["errors"]:
        raise ValueError(f"Dataset validation failed: {report['errors']}")

    logger.info(
        "Raw dataset validated: %d rows, %d columns; %d zero-income rows will be excluded from processing.",
        len(df), len(df.columns), report["zero_income_rows"],
    )
    return True, report, df


def handle_known_anomalies(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    df = df.copy()
    mask = df["residential_assets_value"] == KNOWN_RESIDENTIAL_ASSET_ANOMALY
    count = int(mask.sum())
    if count:
        df.loc[mask, "residential_assets_value"] = 0
        logger.info("Replaced %d residential asset placeholders (-100000) with 0.", count)
    return df, count


def remove_non_trainable_rows(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    """Exclude rows that cannot safely support income-based feature engineering."""
    df = df.copy()
    mask = df["income_annum"] <= 0
    count = int(mask.sum())
    if count:
        logger.warning(
            "Excluding %d rows with income_annum <= 0 from processed/training data. "
            "The raw CSV remains unchanged.",
            count,
        )
        df = df.loc[~mask].copy()
    return df, count


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["monthly_income"] = df["income_annum"] / 12.0
    df["loan_to_annual_income_ratio"] = df["loan_amount"] / df["income_annum"]
    df["loan_to_monthly_income_ratio"] = df["loan_amount"] / df["monthly_income"]

    df["total_asset_value"] = (
        df["residential_assets_value"]
        + df["commercial_assets_value"]
        + df["luxury_assets_value"]
        + df["bank_asset_value"]
    )
    df["asset_to_loan_ratio"] = df["total_asset_value"] / df["loan_amount"]
    df["bank_asset_to_annual_income_ratio"] = df["bank_asset_value"] / df["income_annum"]
    df["asset_coverage_ratio"] = df["total_asset_value"] / df["loan_amount"]
    df["loan_term_months"] = df["loan_term"] * 12
    df["estimated_principal_monthly_payment"] = (
        df["loan_amount"] / df["loan_term_months"]
    )
    df["estimated_payment_to_income_ratio"] = (
        df["estimated_principal_monthly_payment"] / df["monthly_income"]
    )
    return df


def prepare_dataset(
    input_path: str | Path,
    output_path: str | Path | None = None,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Prepare the new 10,000-row raw dataset for model training."""
    _, validation_report, df = validate_dataset(input_path)

    # Dataset-specific handling: remove 3 zero-income rows before division-based features.
    df, excluded_zero_income = remove_non_trainable_rows(df)

    # Correct the known -100000 residential asset placeholder.
    df, anomaly_corrections = handle_known_anomalies(df)

    # Deterministic feature engineering.
    df = engineer_features(df)

    # Encode target.
    df[TARGET_COLUMN] = df[SOURCE_TARGET_COLUMN].map(TARGET_MAPPING)
    if df[TARGET_COLUMN].isnull().any():
        raise ValueError("Target encoding produced null values.")

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    numeric_values = df[numeric_cols].to_numpy(dtype=float)
    if np.isnan(numeric_values).any() or np.isinf(numeric_values).any():
        raise ValueError("Processed dataset contains NaN or infinite numeric values.")

    summary: Dict[str, Any] = {
        "raw_rows": validation_report["total_rows"],
        "processed_rows": len(df),
        "excluded_zero_income_rows": excluded_zero_income,
        "total_columns": len(df.columns),
        "source_features": SOURCE_FEATURES,
        "engineered_features": ENGINEERED_FEATURES,
        "target_column": TARGET_COLUMN,
        "anomaly_corrections": anomaly_corrections,
        "target_distribution": {
            str(k): int(v) for k, v in df[TARGET_COLUMN].value_counts().items()
        },
    }

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        logger.info("Processed dataset saved to %s", output_path)

    return df, summary


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parents[1]
    raw_path = base_dir / "data" / "raw" / "loan_approval_dataset.csv"
    processed_path = base_dir / "data" / "processed" / "loan_approval_processed.csv"

    df, summary = prepare_dataset(raw_path, processed_path)

    print("\n================ DATA PREPARATION SUMMARY ================")
    print(f"Raw Records            : {summary['raw_rows']}")
    print(f"Processed Records      : {summary['processed_rows']}")
    print(f"Zero-income Excluded   : {summary['excluded_zero_income_rows']}")
    print(f"Residential Corrections: {summary['anomaly_corrections']}")
    print(f"Target Distribution    : {summary['target_distribution']}")
    print(f"Output                 : {processed_path}")
    print("==========================================================\n")