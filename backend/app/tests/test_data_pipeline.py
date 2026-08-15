"""CrediWiseAI - Data Pipeline Test Suite.

Verifies raw dataset validation, anomaly recovery, deterministic feature engineering,
target mapping, currency preservation, and absence of prohibited legacy features.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

from ml.prepare_data import (
    ENGINEERED_FEATURES,
    EXPECTED_SOURCE_COLUMNS,
    KNOWN_RESIDENTIAL_ASSET_ANOMALY,
    SOURCE_FEATURES,
    SOURCE_TARGET_COLUMN,
    TARGET_COLUMN,
    TARGET_MAPPING,
    VALID_CATEGORICALS,
    clean_column_names,
    clean_string_values,
    engineer_features,
    handle_known_anomalies,
    prepare_dataset,
    validate_dataset,
)

RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "loan_approval_dataset.csv"
PROCESSED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "loan_approval_processed.csv"

PROHIBITED_LEGACY_FEATURES = [
    "age",
    "marital_status",
    "residence_type",
    "employment_duration",
    "existing_monthly_debt",
    "existing_emi",
    "credit_history_length",
    "previous_loans",
    "previous_defaults",
]


class TestDataPipeline(unittest.TestCase):
    """Test suite for Phase 1 data validation and feature preparation."""

    @classmethod
    def setUpClass(cls):
        """Load datasets once for test class."""
        assert RAW_DATA_PATH.exists(), f"Raw dataset missing at {RAW_DATA_PATH}"
        raw = pd.read_csv(RAW_DATA_PATH)
        cls.raw_df = clean_string_values(clean_column_names(raw))

        if not PROCESSED_DATA_PATH.exists():
            cls.processed_df, _ = prepare_dataset(RAW_DATA_PATH, PROCESSED_DATA_PATH)
        else:
            cls.processed_df = pd.read_csv(PROCESSED_DATA_PATH)

    def test_01_source_schema_validation(self):
        """Verifies that the raw dataset matches the expected Kaggle schema exactly."""
        self.assertEqual(len(self.raw_df), 4269, f"Expected 4269 rows, got {len(self.raw_df)}")
        for col in EXPECTED_SOURCE_COLUMNS:
            self.assertIn(col, self.raw_df.columns, f"Missing required column {col} in raw dataset")

        # Validate categoricals
        for cat_col, valid_set in VALID_CATEGORICALS.items():
            unique_vals = set(self.raw_df[cat_col].unique())
            self.assertTrue(
                unique_vals.issubset(valid_set),
                f"Unexpected values in {cat_col}: {unique_vals}",
            )

        # Validate pipeline validation function
        is_valid, report, _ = validate_dataset(RAW_DATA_PATH)
        self.assertTrue(is_valid)
        self.assertEqual(report["total_rows"], 4269)
        self.assertEqual(report["duplicate_rows"], 0)
        self.assertEqual(report["duplicate_loan_ids"], 0)

    def test_02_processed_dataset_exists(self):
        """Verifies that the processed dataset artifact exists on disk and is non-empty."""
        self.assertTrue(PROCESSED_DATA_PATH.exists(), f"Processed CSV missing at {PROCESSED_DATA_PATH}")
        self.assertGreater(PROCESSED_DATA_PATH.stat().st_size, 0, "Processed CSV file is empty")

    def test_03_processed_row_count(self):
        """Verifies that no rows were dropped during cleaning and preparation."""
        self.assertEqual(len(self.processed_df), len(self.raw_df))
        self.assertEqual(len(self.processed_df), 4269)
        self.assertEqual(self.processed_df["loan_id"].nunique(), 4269)

    def test_04_no_unexpected_null_or_infinite_values(self):
        """Verifies that processed dataset has zero null, NaN, or infinite values."""
        self.assertEqual(int(self.processed_df.isnull().sum().sum()), 0, "Found unexpected null values in processed dataset")
        numeric_cols = self.processed_df.select_dtypes(include=[np.number]).columns
        self.assertFalse(
            bool(np.isinf(self.processed_df[numeric_cols].to_numpy()).any()),
            "Found infinite values in processed dataset",
        )

    def test_05_target_encoding(self):
        """Verifies that target mapping is binary (1 for Approved, 0 for Rejected)."""
        self.assertIn(TARGET_COLUMN, self.processed_df.columns)
        self.assertEqual(set(self.processed_df[TARGET_COLUMN].unique()), {0, 1})

        # Match counts exactly with source
        approved_source_count = int((self.raw_df[SOURCE_TARGET_COLUMN] == "Approved").sum())
        rejected_source_count = int((self.raw_df[SOURCE_TARGET_COLUMN] == "Rejected").sum())

        self.assertEqual(int((self.processed_df[TARGET_COLUMN] == 1).sum()), approved_source_count)
        self.assertEqual(int((self.processed_df[TARGET_COLUMN] == 0).sum()), rejected_source_count)
        self.assertEqual(approved_source_count, 2656)
        self.assertEqual(rejected_source_count, 1613)

    def test_06_engineered_feature_formulas(self):
        """Verifies that all 10 engineered features match the exact deterministic formulas."""
        # 1. monthly_income = income_annum / 12
        np.testing.assert_allclose(
            self.processed_df["monthly_income"],
            self.processed_df["income_annum"] / 12.0,
            rtol=1e-5,
            err_msg="monthly_income formula mismatch",
        )

        # 2. loan_to_annual_income_ratio = loan_amount / income_annum
        np.testing.assert_allclose(
            self.processed_df["loan_to_annual_income_ratio"],
            self.processed_df["loan_amount"] / self.processed_df["income_annum"],
            rtol=1e-5,
            err_msg="loan_to_annual_income_ratio mismatch",
        )

        # 3. loan_to_monthly_income_ratio = loan_amount / monthly_income
        np.testing.assert_allclose(
            self.processed_df["loan_to_monthly_income_ratio"],
            self.processed_df["loan_amount"] / self.processed_df["monthly_income"],
            rtol=1e-5,
            err_msg="loan_to_monthly_income_ratio mismatch",
        )

        # 4. total_asset_value = sum of 4 asset categories
        expected_assets = (
            self.processed_df["residential_assets_value"]
            + self.processed_df["commercial_assets_value"]
            + self.processed_df["luxury_assets_value"]
            + self.processed_df["bank_asset_value"]
        )
        np.testing.assert_allclose(
            self.processed_df["total_asset_value"],
            expected_assets,
            rtol=1e-5,
            err_msg="total_asset_value formula mismatch",
        )

        # 5. asset_to_loan_ratio = total_asset_value / loan_amount
        np.testing.assert_allclose(
            self.processed_df["asset_to_loan_ratio"],
            self.processed_df["total_asset_value"] / self.processed_df["loan_amount"],
            rtol=1e-5,
            err_msg="asset_to_loan_ratio mismatch",
        )

        # 6. bank_asset_to_annual_income_ratio = bank_asset_value / income_annum
        np.testing.assert_allclose(
            self.processed_df["bank_asset_to_annual_income_ratio"],
            self.processed_df["bank_asset_value"] / self.processed_df["income_annum"],
            rtol=1e-5,
            err_msg="bank_asset_to_annual_income_ratio mismatch",
        )

        # 7. asset_coverage_ratio = total_asset_value / loan_amount
        np.testing.assert_allclose(
            self.processed_df["asset_coverage_ratio"],
            self.processed_df["total_asset_value"] / self.processed_df["loan_amount"],
            rtol=1e-5,
            err_msg="asset_coverage_ratio mismatch",
        )

        # 8. loan_term_months = loan_term * 12
        np.testing.assert_array_equal(
            self.processed_df["loan_term_months"],
            self.processed_df["loan_term"] * 12,
            err_msg="loan_term_months mismatch",
        )

        # 9. estimated_principal_monthly_payment = loan_amount / loan_term_months
        np.testing.assert_allclose(
            self.processed_df["estimated_principal_monthly_payment"],
            self.processed_df["loan_amount"] / self.processed_df["loan_term_months"],
            rtol=1e-5,
            err_msg="estimated_principal_monthly_payment mismatch",
        )

        # 10. estimated_payment_to_income_ratio = estimated_principal_monthly_payment / monthly_income
        np.testing.assert_allclose(
            self.processed_df["estimated_payment_to_income_ratio"],
            self.processed_df["estimated_principal_monthly_payment"] / self.processed_df["monthly_income"],
            rtol=1e-5,
            err_msg="estimated_payment_to_income_ratio mismatch",
        )

    def test_07_inr_currency_preservation(self):
        """Verifies that financial values remain native INR without USD conversions or arbitrary scaling."""
        self.assertGreaterEqual(self.processed_df["income_annum"].min(), 200000)
        self.assertLessEqual(self.processed_df["income_annum"].max(), 9900000)
        self.assertGreaterEqual(self.processed_df["loan_amount"].min(), 300000)
        self.assertLessEqual(self.processed_df["loan_amount"].max(), 39500000)
        self.assertGreaterEqual(self.processed_df["total_asset_value"].min(), 500000)
        self.assertLessEqual(self.processed_df["total_asset_value"].max(), 90700000)

    def test_08_excluded_and_prohibited_legacy_features(self):
        """Verifies that no unsupported legacy fields exist in the processed dataset or ML feature lists."""
        for prohibited in PROHIBITED_LEGACY_FEATURES:
            self.assertNotIn(prohibited, self.processed_df.columns, f"Prohibited feature {prohibited} found in columns")
            self.assertNotIn(prohibited, SOURCE_FEATURES, f"Prohibited feature {prohibited} in SOURCE_FEATURES")
            self.assertNotIn(prohibited, ENGINEERED_FEATURES, f"Prohibited feature {prohibited} in ENGINEERED_FEATURES")

        # Verify target and IDs are not in feature lists
        self.assertNotIn("loan_id", SOURCE_FEATURES)
        self.assertNotIn("loan_status", SOURCE_FEATURES)
        self.assertNotIn("loan_approved", SOURCE_FEATURES)
        self.assertNotIn("loan_id", ENGINEERED_FEATURES)
        self.assertNotIn("loan_status", ENGINEERED_FEATURES)
        self.assertNotIn("loan_approved", ENGINEERED_FEATURES)

    def test_09_known_residential_asset_anomaly_handling(self):
        """Verifies that exactly the 28 instances of -100000 in residential_assets_value are converted to 0."""
        raw_anomalies = int((self.raw_df["residential_assets_value"] == KNOWN_RESIDENTIAL_ASSET_ANOMALY).sum())
        self.assertEqual(raw_anomalies, 28, f"Expected 28 anomalies in raw dataset, found {raw_anomalies}")

        # In processed dataset, no negative values exist
        self.assertEqual(int((self.processed_df["residential_assets_value"] < 0).sum()), 0)
        self.assertEqual(float(self.processed_df["residential_assets_value"].min()), 0.0)

        # Ensure anomaly rows have 0 in processed dataset
        anomaly_indices = self.raw_df[self.raw_df["residential_assets_value"] == KNOWN_RESIDENTIAL_ASSET_ANOMALY].index
        self.assertTrue((self.processed_df.loc[anomaly_indices, "residential_assets_value"] == 0).all())

    def test_10_raw_dataset_immutability(self):
        """Verifies that the raw dataset file was not mutated in place."""
        raw_df_direct = pd.read_csv(RAW_DATA_PATH)
        raw_df_direct = clean_column_names(raw_df_direct)
        anomalies = int((raw_df_direct["residential_assets_value"] == KNOWN_RESIDENTIAL_ASSET_ANOMALY).sum())
        self.assertEqual(anomalies, 28, "Raw dataset was modified in place!")


if __name__ == "__main__":
    unittest.main(verbosity=2)
