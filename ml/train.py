"""CrediWiseAI - Machine Learning Model Training, Comparison, and Artifact Serialization.

Trains and evaluates Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting
models on the validated Kaggle INR-native dataset using Stratified 5-Fold Cross Validation
and held-out test evaluation. Performs ablation audits, split sensitivity checks, Indian
applicant stress tests, and serializes the winning model bundle to ml/models/loan_model_v2.joblib.
"""

from __future__ import annotations

import json
import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROCESSED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "loan_approval_processed.csv"
MODEL_ARTIFACT_PATH = PROJECT_ROOT / "ml" / "models" / "loan_model_v2.joblib"
MODEL_VERSION = "loan-model-v2.0"
TRAINING_CURRENCY = "INR"
RANDOM_STATE = 42

# 18 Numeric Features + 2 Categorical Features (20 Total Model Features)
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

TARGET_COLUMN = "loan_approved"
EXCLUDED_FEATURES = ["loan_id", "loan_status", "loan_approved", "asset_coverage_ratio"]


def build_preprocessor(
    num_features: List[str] = ALLOWED_NUMERIC_FEATURES,
    cat_features: List[str] = ALLOWED_CATEGORICAL_FEATURES,
) -> ColumnTransformer:
    """Builds a scikit-learn ColumnTransformer for numeric scaling and one-hot encoding."""
    transformers = []
    if num_features:
        transformers.append(("num", StandardScaler(), num_features))
    if cat_features:
        transformers.append(
            ("cat", OneHotEncoder(handle_unknown="ignore", drop="if_binary"), cat_features)
        )
    return ColumnTransformer(transformers=transformers)


def get_candidate_models(random_state: int = RANDOM_STATE) -> Dict[str, Any]:
    """Returns the candidate model architectures specified in the PRD."""
    return {
        "Logistic Regression": LogisticRegression(max_iter=2000, random_state=random_state),
        "Decision Tree": DecisionTreeClassifier(max_depth=5, random_state=random_state),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=8, random_state=random_state
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.05, max_depth=3, random_state=random_state
        ),
    }


def evaluate_models_cross_validation(
    models: Dict[str, Any],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    preprocessor: ColumnTransformer,
    cv_folds: int = 5,
    random_state: int = RANDOM_STATE,
) -> Dict[str, Dict[str, Any]]:
    """Runs 5-fold Stratified Cross-Validation on training data for each candidate model."""
    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
    cv_results = {}

    scoring = {
        "accuracy": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc",
    }

    for name, model in models.items():
        pipeline = Pipeline([("preprocessor", preprocessor), ("classifier", model)])
        scores = cross_validate(
            pipeline, X_train, y_train, cv=skf, scoring=scoring, n_jobs=-1, return_train_score=False
        )

        cv_results[name] = {
            "accuracy_mean": float(np.mean(scores["test_accuracy"])),
            "accuracy_std": float(np.std(scores["test_accuracy"])),
            "precision_mean": float(np.mean(scores["test_precision"])),
            "precision_std": float(np.std(scores["test_precision"])),
            "recall_mean": float(np.mean(scores["test_recall"])),
            "recall_std": float(np.std(scores["test_recall"])),
            "f1_mean": float(np.mean(scores["test_f1"])),
            "f1_std": float(np.std(scores["test_f1"])),
            "roc_auc_mean": float(np.mean(scores["test_roc_auc"])),
            "roc_auc_std": float(np.std(scores["test_roc_auc"])),
        }
        logger.info(
            f"CV [{name:<19}] F1: {cv_results[name]['f1_mean']:.4f} ± {cv_results[name]['f1_std']:.4f} | "
            f"ROC-AUC: {cv_results[name]['roc_auc_mean']:.4f} | Acc: {cv_results[name]['accuracy_mean']:.4f}"
        )

    return cv_results


def evaluate_models_test_set(
    models: Dict[str, Any],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    preprocessor: ColumnTransformer,
) -> Dict[str, Dict[str, Any]]:
    """Fits full pipelines on X_train and evaluates performance on held-out X_test."""
    test_results = {}

    for name, model in models.items():
        pipeline = Pipeline([("preprocessor", preprocessor), ("classifier", model)])
        start_time = time.time()
        pipeline.fit(X_train, y_train)
        fit_time = time.time() - start_time

        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_prob)
        brier = brier_score_loss(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()
        report = classification_report(y_test, y_pred, output_dict=True)

        test_results[name] = {
            "pipeline": pipeline,
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1),
            "roc_auc": float(roc_auc),
            "brier_score_loss": float(brier),
            "confusion_matrix": cm,
            "classification_report": report,
            "fit_time_seconds": float(fit_time),
        }
        logger.info(
            f"Test [{name:<19}] F1: {f1:.4f} | ROC-AUC: {roc_auc:.4f} | Acc: {acc:.4f} | Brier: {brier:.4f}"
        )

    return test_results


def extract_feature_importances(
    pipeline: Pipeline,
    num_features: List[str] = ALLOWED_NUMERIC_FEATURES,
    cat_features: List[str] = ALLOWED_CATEGORICAL_FEATURES,
) -> List[Tuple[str, float]]:
    """Extracts and maps feature importance scores or coefficients back to human-readable names."""
    classifier = pipeline.named_steps["classifier"]
    preprocessor = pipeline.named_steps["preprocessor"]

    feature_names = []
    if num_features:
        feature_names.extend(num_features)
    if cat_features:
        cat_encoder = preprocessor.named_transformers_["cat"]
        cat_encoded_names = list(cat_encoder.get_feature_names_out(cat_features))
        feature_names.extend(cat_encoded_names)

    importances: List[Tuple[str, float]] = []

    if hasattr(classifier, "feature_importances_"):
        raw_importances = classifier.feature_importances_
        for name, score in zip(feature_names, raw_importances):
            importances.append((name, float(score)))
    elif hasattr(classifier, "coef_"):
        raw_importances = np.abs(classifier.coef_[0])
        for name, score in zip(feature_names, raw_importances):
            importances.append((name, float(score)))

    importances.sort(key=lambda x: x[1], reverse=True)
    return importances


def run_ablation_audit(
    df: pd.DataFrame,
    random_state: int = RANDOM_STATE,
) -> Dict[str, Dict[str, float]]:
    """Runs ablation experiments to measure reliance on CIBIL score, raw vs engineered features."""
    experiments = {
        "Full Feature Model": (ALLOWED_NUMERIC_FEATURES, ALLOWED_CATEGORICAL_FEATURES),
        "Without CIBIL Score": (
            [f for f in ALLOWED_NUMERIC_FEATURES if f != "cibil_score"],
            ALLOWED_CATEGORICAL_FEATURES,
        ),
        "Raw Features Only": (
            [
                "no_of_dependents",
                "income_annum",
                "loan_amount",
                "loan_term",
                "cibil_score",
                "residential_assets_value",
                "commercial_assets_value",
                "luxury_assets_value",
                "bank_asset_value",
            ],
            ALLOWED_CATEGORICAL_FEATURES,
        ),
        "Engineered Features Only": (
            [
                "monthly_income",
                "loan_to_annual_income_ratio",
                "loan_to_monthly_income_ratio",
                "total_asset_value",
                "asset_to_loan_ratio",
                "bank_asset_to_annual_income_ratio",
                "loan_term_months",
                "estimated_principal_monthly_payment",
                "estimated_payment_to_income_ratio",
            ],
            [],
        ),
    }

    ablation_results = {}
    y = df[TARGET_COLUMN]

    for exp_name, (num_f, cat_f) in experiments.items():
        X = df[num_f + cat_f]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, stratify=y, random_state=random_state, shuffle=True
        )

        preproc = build_preprocessor(num_f, cat_f)
        clf = GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.05, max_depth=3, random_state=random_state
        )
        pipe = Pipeline([("preprocessor", preproc), ("classifier", clf)])
        pipe.fit(X_train, y_train)

        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test)[:, 1]

        ablation_results[exp_name] = {
            "num_features": len(num_f) + len(cat_f),
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred)),
            "recall": float(recall_score(y_test, y_pred)),
            "f1": float(f1_score(y_test, y_pred)),
            "roc_auc": float(roc_auc_score(y_test, y_prob)),
        }

    return ablation_results


def run_split_sensitivity(
    df: pd.DataFrame,
    random_states: List[int] = [42, 7, 21, 100, 2026],
) -> Dict[str, Any]:
    """Evaluates Gradient Boosting stability across multiple train/test partition seeds."""
    X = df[ALLOWED_NUMERIC_FEATURES + ALLOWED_CATEGORICAL_FEATURES]
    y = df[TARGET_COLUMN]

    f1_scores = []
    roc_aucs = []
    accuracies = []

    for seed in random_states:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, stratify=y, random_state=seed, shuffle=True
        )
        preproc = build_preprocessor()
        clf = GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.05, max_depth=3, random_state=seed
        )
        pipe = Pipeline([("preprocessor", preproc), ("classifier", clf)])
        pipe.fit(X_train, y_train)

        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test)[:, 1]

        f1_scores.append(float(f1_score(y_test, y_pred)))
        roc_aucs.append(float(roc_auc_score(y_test, y_prob)))
        accuracies.append(float(accuracy_score(y_test, y_pred)))

    return {
        "seeds_tested": random_states,
        "f1_mean": float(np.mean(f1_scores)),
        "f1_std": float(np.std(f1_scores)),
        "f1_values": f1_scores,
        "roc_auc_mean": float(np.mean(roc_aucs)),
        "roc_auc_std": float(np.std(roc_aucs)),
        "accuracy_mean": float(np.mean(accuracies)),
    }


def run_indian_applicant_stress_tests(pipeline: Pipeline) -> List[Dict[str, Any]]:
    """Runs realistic Indian applicant stress test cases through the trained pipeline."""
    profiles = [
        {
            "name": "Strong Indian Applicant",
            "education": "Graduate",
            "self_employed": "No",
            "no_of_dependents": 2,
            "cibil_score": 780,
            "income_annum": 1200000.0,  # 1L/month
            "loan_amount": 1500000.0,
            "loan_term": 5,  # 60 months
            "residential_assets_value": 4000000.0,
            "commercial_assets_value": 0.0,
            "luxury_assets_value": 800000.0,
            "bank_asset_value": 1500000.0,
        },
        {
            "name": "Moderate Indian Applicant",
            "education": "Graduate",
            "self_employed": "Yes",
            "no_of_dependents": 1,
            "cibil_score": 700,
            "income_annum": 720000.0,  # 60k/month
            "loan_amount": 800000.0,
            "loan_term": 5,  # 60 months
            "residential_assets_value": 2000000.0,
            "commercial_assets_value": 0.0,
            "luxury_assets_value": 400000.0,
            "bank_asset_value": 600000.0,
        },
        {
            "name": "Borderline Applicant",
            "education": "Not Graduate",
            "self_employed": "No",
            "no_of_dependents": 3,
            "cibil_score": 650,
            "income_annum": 600000.0,  # 50k/month
            "loan_amount": 1000000.0,
            "loan_term": 4,  # 48 months
            "residential_assets_value": 1000000.0,
            "commercial_assets_value": 0.0,
            "luxury_assets_value": 200000.0,
            "bank_asset_value": 300000.0,
        },
        {
            "name": "High Risk Applicant",
            "education": "Not Graduate",
            "self_employed": "Yes",
            "no_of_dependents": 4,
            "cibil_score": 560,
            "income_annum": 420000.0,  # 35k/month
            "loan_amount": 1200000.0,
            "loan_term": 3,  # 36 months
            "residential_assets_value": 500000.0,
            "commercial_assets_value": 0.0,
            "luxury_assets_value": 100000.0,
            "bank_asset_value": 150000.0,
        },
        {
            "name": "Sub-550 CIBIL Applicant",
            "education": "Graduate",
            "self_employed": "No",
            "no_of_dependents": 2,
            "cibil_score": 450,
            "income_annum": 480000.0,  # 40k/month
            "loan_amount": 1000000.0,
            "loan_term": 3,  # 36 months
            "residential_assets_value": 1500000.0,
            "commercial_assets_value": 0.0,
            "luxury_assets_value": 300000.0,
            "bank_asset_value": 200000.0,
        },
    ]

    stress_results = []
    for p in profiles:
        # Derive engineered features deterministically
        monthly_inc = p["income_annum"] / 12.0
        lt_annual_inc = p["loan_amount"] / p["income_annum"]
        lt_monthly_inc = p["loan_amount"] / monthly_inc
        tot_assets = (
            p["residential_assets_value"]
            + p["commercial_assets_value"]
            + p["luxury_assets_value"]
            + p["bank_asset_value"]
        )
        asset_to_loan = tot_assets / p["loan_amount"]
        bank_asset_to_inc = p["bank_asset_value"] / p["income_annum"]
        loan_months = p["loan_term"] * 12
        est_payment = p["loan_amount"] / loan_months
        est_payment_ratio = est_payment / monthly_inc

        row_dict = {
            "no_of_dependents": p["no_of_dependents"],
            "income_annum": p["income_annum"],
            "loan_amount": p["loan_amount"],
            "loan_term": p["loan_term"],
            "cibil_score": p["cibil_score"],
            "residential_assets_value": p["residential_assets_value"],
            "commercial_assets_value": p["commercial_assets_value"],
            "luxury_assets_value": p["luxury_assets_value"],
            "bank_asset_value": p["bank_asset_value"],
            "monthly_income": monthly_inc,
            "loan_to_annual_income_ratio": lt_annual_inc,
            "loan_to_monthly_income_ratio": lt_monthly_inc,
            "total_asset_value": tot_assets,
            "asset_to_loan_ratio": asset_to_loan,
            "bank_asset_to_annual_income_ratio": bank_asset_to_inc,
            "loan_term_months": loan_months,
            "estimated_principal_monthly_payment": est_payment,
            "estimated_payment_to_income_ratio": est_payment_ratio,
            "education": p["education"],
            "self_employed": p["self_employed"],
        }

        input_df = pd.DataFrame([row_dict])
        prob = float(pipeline.predict_proba(input_df)[0, 1])
        pred = int(pipeline.predict(input_df)[0])

        recommendation = "APPROVE" if prob >= 0.70 else ("MANUAL_REVIEW" if prob >= 0.40 else "REJECT")
        risk_level = "LOW" if prob >= 0.70 else ("MEDIUM" if prob >= 0.40 else "HIGH")

        stress_results.append(
            {
                "profile_name": p["name"],
                "cibil_score": p["cibil_score"],
                "monthly_income_inr": f"₹{monthly_inc:,.0f}",
                "loan_amount_inr": f"₹{p['loan_amount']:,.0f}",
                "tenure_months": loan_months,
                "approval_probability": round(prob, 4),
                "predicted_class": pred,
                "recommendation": recommendation,
                "risk_level": risk_level,
            }
        )

    return stress_results


def train_and_serialize_pipeline(
    data_path: Path = PROCESSED_DATA_PATH,
    model_output_path: Path = MODEL_ARTIFACT_PATH,
) -> Dict[str, Any]:
    """Orchestrates full ML training, evaluation, comparison, ablation, stress testing, and serialization."""
    logger.info("Initializing CrediWiseAI Phase 2 ML Training Pipeline...")

    if not data_path.exists():
        raise FileNotFoundError(f"Processed dataset not found: {data_path}")

    df = pd.read_csv(data_path)
    logger.info(f"Loaded processed dataset: {len(df)} rows.")

    # 1. Feature Matrix & Target
    feature_cols = ALLOWED_NUMERIC_FEATURES + ALLOWED_CATEGORICAL_FEATURES
    X = df[feature_cols]
    y = df[TARGET_COLUMN]

    # Verify no target leakage in X
    for col in EXCLUDED_FEATURES:
        assert col not in X.columns or col == "loan_approved", f"Found excluded feature {col} in X"

    # 2. Stratified Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=RANDOM_STATE, shuffle=True
    )
    logger.info(f"Split dataset: Train={len(X_train)} rows, Test={len(X_test)} rows.")

    preprocessor = build_preprocessor()
    candidate_models = get_candidate_models(random_state=RANDOM_STATE)

    # 3. Stratified 5-Fold Cross-Validation
    logger.info("Running Stratified 5-Fold Cross-Validation across candidate models...")
    cv_metrics = evaluate_models_cross_validation(
        candidate_models, X_train, y_train, preprocessor, cv_folds=5, random_state=RANDOM_STATE
    )

    # 4. Held-out Test Evaluation
    logger.info("Evaluating all candidate models on held-out test set (20%)...")
    test_metrics = evaluate_models_test_set(
        candidate_models, X_train, y_train, X_test, y_test, preprocessor
    )

    # 5. Model Selection based on CV F1 and ROC-AUC
    # Primary: CV F1, Secondary: CV ROC-AUC
    selected_name = max(
        cv_metrics.keys(),
        key=lambda k: (cv_metrics[k]["f1_mean"], cv_metrics[k]["roc_auc_mean"]),
    )
    selected_pipeline = test_metrics[selected_name]["pipeline"]
    logger.info(f"Selected Champion Model: '{selected_name}' (CV F1: {cv_metrics[selected_name]['f1_mean']:.4f})")

    # 6. Feature Importance Extraction
    importances = extract_feature_importances(selected_pipeline)

    # 7. Ablation & Dominance Audit
    logger.info("Running Ablation and Integrity Audits...")
    ablation_results = run_ablation_audit(df, random_state=RANDOM_STATE)

    # 8. Split Sensitivity Analysis
    logger.info("Running Split Sensitivity Analysis...")
    sensitivity_results = run_split_sensitivity(df)

    # 9. Realistic Indian Applicant Stress Tests
    logger.info("Executing Realistic Indian Applicant Stress Tests...")
    stress_results = run_indian_applicant_stress_tests(selected_pipeline)

    # 10. Assemble and Serialize Model Artifact
    model_output_path.parent.mkdir(parents=True, exist_ok=True)
    artifact_bundle = {
        "pipeline": selected_pipeline,
        "model_name": selected_name,
        "model_version": MODEL_VERSION,
        "num_features": ALLOWED_NUMERIC_FEATURES,
        "cat_features": ALLOWED_CATEGORICAL_FEATURES,
        "feature_names": feature_cols,
        "feature_importances": importances,
        "metrics": {
            "test_accuracy": test_metrics[selected_name]["accuracy"],
            "test_precision": test_metrics[selected_name]["precision"],
            "test_recall": test_metrics[selected_name]["recall"],
            "test_f1": test_metrics[selected_name]["f1"],
            "test_roc_auc": test_metrics[selected_name]["roc_auc"],
            "test_brier_score": test_metrics[selected_name]["brier_score_loss"],
            "confusion_matrix": test_metrics[selected_name]["confusion_matrix"],
        },
        "cross_validation_metrics": cv_metrics[selected_name],
        "all_models_cv_metrics": cv_metrics,
        "all_models_test_metrics": {
            k: {m: v for m, v in vals.items() if m != "pipeline"}
            for k, vals in test_metrics.items()
        },
        "ablation_results": ablation_results,
        "split_sensitivity": sensitivity_results,
        "stress_test_results": stress_results,
        "training_row_count": len(X_train),
        "test_row_count": len(X_test),
        "training_currency": TRAINING_CURRENCY,
        "random_state": RANDOM_STATE,
    }

    joblib.dump(artifact_bundle, model_output_path)
    logger.info(f"Successfully serialized production model artifact to: {model_output_path}")

    return artifact_bundle


if __name__ == "__main__":
    bundle = train_and_serialize_pipeline()
    print("\n========================================================")
    print("           CREDIWISE-AI MODEL TRAINING SUMMARY           ")
    print("========================================================")
    print(f"Model Champion      : {bundle['model_name']} ({bundle['model_version']})")
    print(f"Training Rows       : {bundle['training_row_count']} | Test Rows: {bundle['test_row_count']}")
    print(f"Test Accuracy       : {bundle['metrics']['test_accuracy']:.4f}")
    print(f"Test F1 Score       : {bundle['metrics']['test_f1']:.4f}")
    print(f"Test ROC-AUC        : {bundle['metrics']['test_roc_auc']:.4f}")
    print(f"Brier Score Loss    : {bundle['metrics']['test_brier_score']:.4f}")
    print("\nTop 5 Feature Importances:")
    for feat, imp in bundle["feature_importances"][:5]:
        print(f"   - {feat:<35}: {imp:.4f}")
    print("\nApplicant Stress Test Summary:")
    for st in bundle["stress_test_results"]:
        print(
            f"   - {st['profile_name']:<25} | CIBIL: {st['cibil_score']} | Prob: {st['approval_probability']:.2%} | Rec: {st['recommendation']}"
        )
    print("========================================================\n")
