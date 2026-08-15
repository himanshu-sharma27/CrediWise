"""CrediWiseAI - Model Training & Artifact Verification Test Suite.

Verifies processed data ingestion, leakage exclusion, stratified splitting,
preprocessor fitting, candidate model training, cross-validation, test evaluation,
probability bounds, artifact integrity, and single applicant inference.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from ml.train import (
    ALLOWED_CATEGORICAL_FEATURES,
    ALLOWED_NUMERIC_FEATURES,
    EXCLUDED_FEATURES,
    MODEL_ARTIFACT_PATH,
    MODEL_VERSION,
    PROCESSED_DATA_PATH,
    RANDOM_STATE,
    TARGET_COLUMN,
    build_preprocessor,
    get_candidate_models,
    run_indian_applicant_stress_tests,
)


class TestModelTraining(unittest.TestCase):
    """Automated tests for Phase 2 ML training and artifact integrity."""

    @classmethod
    def setUpClass(cls):
        """Loads processed dataset and serialized artifact."""
        assert PROCESSED_DATA_PATH.exists(), f"Missing processed data at {PROCESSED_DATA_PATH}"
        cls.df = pd.read_csv(PROCESSED_DATA_PATH)

        assert MODEL_ARTIFACT_PATH.exists(), f"Missing model artifact at {MODEL_ARTIFACT_PATH}"
        cls.artifact = joblib.load(MODEL_ARTIFACT_PATH)

    def test_01_processed_dataset_loads(self):
        """Verifies that processed dataset loads with 4,269 rows."""
        self.assertEqual(len(self.df), 4269)
        self.assertIn(TARGET_COLUMN, self.df.columns)

    def test_02_leakage_and_excluded_features(self):
        """Verifies that target, raw status, ID, and duplicate features are excluded from features."""
        feature_cols = ALLOWED_NUMERIC_FEATURES + ALLOWED_CATEGORICAL_FEATURES
        self.assertEqual(len(feature_cols), 20)

        for excluded in EXCLUDED_FEATURES:
            self.assertNotIn(
                excluded,
                feature_cols,
                f"Forbidden feature {excluded} present in model feature list",
            )

        self.assertNotIn(TARGET_COLUMN, feature_cols)
        self.assertNotIn("loan_status", feature_cols)
        self.assertNotIn("loan_id", feature_cols)
        self.assertNotIn("asset_coverage_ratio", feature_cols)

    def test_03_train_test_split_is_stratified(self):
        """Verifies that 80/20 train/test split preserves class ratio."""
        X = self.df[ALLOWED_NUMERIC_FEATURES + ALLOWED_CATEGORICAL_FEATURES]
        y = self.df[TARGET_COLUMN]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, stratify=y, random_state=RANDOM_STATE, shuffle=True
        )

        self.assertEqual(len(X_train), 3415)
        self.assertEqual(len(X_test), 854)

        train_pos_ratio = float(y_train.mean())
        test_pos_ratio = float(y_test.mean())
        overall_pos_ratio = float(y.mean())

        self.assertAlmostEqual(train_pos_ratio, overall_pos_ratio, delta=0.01)
        self.assertAlmostEqual(test_pos_ratio, overall_pos_ratio, delta=0.01)

    def test_04_preprocessor_fitting(self):
        """Verifies that ColumnTransformer transforms training features without errors."""
        X = self.df[ALLOWED_NUMERIC_FEATURES + ALLOWED_CATEGORICAL_FEATURES]
        preproc = build_preprocessor()
        transformed = preproc.fit_transform(X)

        # 18 numeric + 2 binary categories = 20 transformed dimensions
        self.assertEqual(transformed.shape[0], len(X))
        self.assertEqual(transformed.shape[1], 20)
        self.assertFalse(np.isnan(transformed).any())

    def test_05_candidate_models_exist(self):
        """Verifies all 4 candidate models are configured correctly."""
        models = get_candidate_models()
        self.assertEqual(
            set(models.keys()),
            {"Logistic Regression", "Decision Tree", "Random Forest", "Gradient Boosting"},
        )

    def test_06_model_artifact_metadata(self):
        """Verifies that the serialized model bundle contains all required metadata keys."""
        required_keys = [
            "pipeline",
            "model_name",
            "model_version",
            "num_features",
            "cat_features",
            "feature_names",
            "metrics",
            "cross_validation_metrics",
            "training_row_count",
            "test_row_count",
            "training_currency",
            "random_state",
        ]

        for k in required_keys:
            self.assertIn(k, self.artifact, f"Missing key '{k}' in model artifact")

        self.assertEqual(self.artifact["model_version"], MODEL_VERSION)
        self.assertEqual(self.artifact["training_currency"], "INR")
        self.assertEqual(self.artifact["training_row_count"], 3415)
        self.assertEqual(self.artifact["test_row_count"], 854)
        self.assertEqual(self.artifact["model_name"], "Gradient Boosting")

    def test_07_model_probabilities_bounds(self):
        """Verifies that predictions and probabilities remain within [0.0, 1.0]."""
        pipeline = self.artifact["pipeline"]
        X_test = self.df[ALLOWED_NUMERIC_FEATURES + ALLOWED_CATEGORICAL_FEATURES].iloc[:100]

        probs = pipeline.predict_proba(X_test)[:, 1]
        preds = pipeline.predict(X_test)

        self.assertTrue((probs >= 0.0).all())
        self.assertTrue((probs <= 1.0).all())
        self.assertTrue(set(preds).issubset({0, 1}))

    def test_08_single_applicant_prediction(self):
        """Verifies that the trained pipeline can predict for a single applicant dictionary."""
        pipeline = self.artifact["pipeline"]

        sample_applicant = pd.DataFrame(
            [
                {
                    "no_of_dependents": 2,
                    "income_annum": 6000000.0,
                    "loan_amount": 18000000.0,
                    "loan_term": 10,
                    "cibil_score": 750,
                    "residential_assets_value": 12000000.0,
                    "commercial_assets_value": 4000000.0,
                    "luxury_assets_value": 15000000.0,
                    "bank_asset_value": 5000000.0,
                    "monthly_income": 500000.0,
                    "loan_to_annual_income_ratio": 3.0,
                    "loan_to_monthly_income_ratio": 36.0,
                    "total_asset_value": 36000000.0,
                    "asset_to_loan_ratio": 2.0,
                    "bank_asset_to_annual_income_ratio": 0.8333,
                    "loan_term_months": 120,
                    "estimated_principal_monthly_payment": 150000.0,
                    "estimated_payment_to_income_ratio": 0.30,
                    "education": "Graduate",
                    "self_employed": "No",
                }
            ]
        )

        prob = float(pipeline.predict_proba(sample_applicant)[0, 1])
        pred = int(pipeline.predict(sample_applicant)[0])

        self.assertGreaterEqual(prob, 0.0)
        self.assertLessEqual(prob, 1.0)
        self.assertIn(pred, [0, 1])
        self.assertGreater(prob, 0.70, "Prime applicant should receive high approval probability")

    def test_09_stress_test_execution(self):
        """Verifies that realistic Indian stress test cases run without error."""
        stress_results = run_indian_applicant_stress_tests(self.artifact["pipeline"])
        self.assertEqual(len(stress_results), 5)
        for res in stress_results:
            self.assertIn("approval_probability", res)
            self.assertIn("recommendation", res)
            self.assertIn("risk_level", res)
            self.assertIn(res["recommendation"], ["APPROVE", "MANUAL_REVIEW", "REJECT"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
