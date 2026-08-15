# CrediWiseAI — Model Card (`loan-model-v2.0`)

> **Model Identifier:** `loan-model-v2.0`  
> **Model Type:** Gradient Boosting Classifier (`scikit-learn`)  
> **Version Release:** 2.0.0 (Phase 2 Trained & Certified)  
> **Artifact Path:** `ml/models/loan_model_v2.joblib`  
> **Training Base Currency:** Indian Rupee (INR / ₹)

---

## 1. Problem Definition & Intended Use

### 1.1 Problem Definition
CrediWiseAI automates credit risk evaluation and loan approval probability estimation for retail loan applicants in the Indian financial context. Given applicant financial information, asset valuations, and credit bureau scores, the model predicts the likelihood of loan sanction, assesses default risk, and outputs explainable factor attributions.

### 1.2 Intended Use
- **Applicant Self-Service:** Provides instant, transparent credit pre-qualification and what-if simulation for loan applicants.
- **Underwriter Decision Support:** Assists credit officers with objective probability metrics, risk classifications (`LOW`, `MEDIUM`, `HIGH`), and key contributing risk factors.

### 1.3 Prohibited Use
- **Automated Rejection without Human Recourse:** Must not be used as an unchecked decision maker for legally binding adverse actions without human review capabilities.
- **Non-INR Applications:** Must not be used for non-Indian monetary contexts without explicit localized retraining.
- **Unverified Fields:** Must not be used with synthetic or hallucinated applicant inputs (e.g. fabricated marital status, age).

---

## 2. Dataset & Features

- **Source Dataset:** Kaggle INR-Native Loan Approval Dataset (`data/raw/loan_approval_dataset.csv`).
- **Dataset Size:** 4,269 total records (Train: 3,415 records | Test: 854 records).
- **Target Definition:** `loan_approved` (Binary: `1` = Approved [62.22%], `0` = Rejected [37.78%]).

### 2.1 Feature List (20 Total Features)

#### 18 Numeric Features:
1. `no_of_dependents` (0-5)
2. `income_annum` (₹2,00,000 – ₹99,00,000)
3. `loan_amount` (₹3,00,000 – ₹3,95,00,000)
4. `loan_term` (2 – 20 years)
5. `cibil_score` (300 – 900)
6. `residential_assets_value` (₹0 – ₹2,91,00,000)
7. `commercial_assets_value` (₹0 – ₹1,94,00,000)
8. `luxury_assets_value` (₹3,00,000 – ₹3,92,00,000)
9. `bank_asset_value` (₹0 – ₹1,47,00,000)
10. `monthly_income` (Derived: $\text{income\_annum} / 12$)
11. `loan_to_annual_income_ratio` (Derived: $\text{loan\_amount} / \text{income\_annum}$)
12. `loan_to_monthly_income_ratio` (Derived: $\text{loan\_amount} / \text{monthly\_income}$)
13. `total_asset_value` (Derived: $\sum \text{Assets}$)
14. `asset_to_loan_ratio` (Derived: $\text{total\_asset\_value} / \text{loan\_amount}$)
15. `bank_asset_to_annual_income_ratio` (Derived: $\text{bank\_asset\_value} / \text{income\_annum}$)
16. `loan_term_months` (Derived: $\text{loan\_term} \times 12$)
17. `estimated_principal_monthly_payment` (Derived: $\text{loan\_amount} / \text{loan\_term\_months}$)
18. `estimated_payment_to_income_ratio` (Derived: $\text{estimated\_principal\_monthly\_payment} / \text{monthly\_income}$)

#### 2 Categorical Features:
19. `education` (`Graduate`, `Not Graduate`)
20. `self_employed` (`Yes`, `No`)

#### Excluded Features:
- `loan_id` (Identifier)
- `loan_status` (Raw target label)
- `asset_coverage_ratio` (Excluded due to exact duplicate equivalence with `asset_to_loan_ratio`)

---

## 3. Preprocessing & Modeling Pipeline

- **Numeric Pipeline:** `StandardScaler` fitted exclusively on training data.
- **Categorical Pipeline:** `OneHotEncoder(handle_unknown='ignore', drop='if_binary')` fitted exclusively on training data.
- **Model Architecture:** `GradientBoostingClassifier(n_estimators=150, learning_rate=0.05, max_depth=3, random_state=42)`.
- **Ensemble Container:** Packaged as an end-to-end `sklearn.pipeline.Pipeline` serialized with `joblib`.

---

## 4. Evaluation & Performance Benchmarks

### 4.1 5-Fold Stratified Cross-Validation ($N=3,415$)
- **Accuracy:** $0.9991 \pm 0.0012$
- **Precision:** $0.9986 \pm 0.0019$
- **Recall:** $1.0000 \pm 0.0000$
- **F1-Score:** $\mathbf{0.9993 \pm 0.0009}$
- **ROC-AUC:** $\mathbf{0.9996 \pm 0.0008}$

### 4.2 Held-Out Test Evaluation (20% Split, $N=854$)
- **Test Accuracy:** $1.0000$ (100.00%)
- **Test Precision:** $1.0000$ (100.00%)
- **Test Recall:** $1.0000$ (100.00%)
- **Test F1-Score:** $1.0000$ (100.00%)
- **Test ROC-AUC:** $1.0000$
- **Brier Score Loss:** $2.54 \times 10^{-5}$ (Highly calibrated)

---

## 5. Feature Importance & Top Drivers

| Rank | Feature | Importance | Interpretation |
| :--- | :--- | :--- | :--- |
| 1 | `cibil_score` | **81.03%** | Bureau creditworthiness & repayment history |
| 2 | `estimated_payment_to_income_ratio` | **11.22%** | Monthly debt cash flow burden |
| 3 | `loan_to_annual_income_ratio` | **3.80%** | Overall borrowing leverage multiple |
| 4 | `loan_to_monthly_income_ratio` | **2.52%** | Monthly leverage multiple |
| 5 | `asset_to_loan_ratio` | **1.35%** | Total collateral backing relative to principal |

---

## 6. Probability Interpretation & Decision Policy

- **Output Range:** Internally bounded strictly within $[0.0, 1.0]$.
- **Statistical Meaning:** The model output represents estimated confidence of sanction based on the Kaggle training distribution.
- **Decision Bands:**
  - $P \ge 0.70 \rightarrow$ `APPROVE` (`LOW` Risk)
  - $0.40 \le P < 0.70 \rightarrow$ `MANUAL_REVIEW` (`MEDIUM` Risk)
  - $P < 0.40 \rightarrow$ `REJECT` (`HIGH` Risk)

---

## 7. Known Dataset Limitations & Disclaimer

1. **Synthetic Kaggle Characteristics:** The Kaggle dataset exhibits a sharp non-linear decision boundary around CIBIL score $\approx 550$. Ablation analysis confirms that removing `cibil_score` drops accuracy to $62.30\%$. Near-perfect test accuracy reflects this dataset-specific boundary rather than guaranteed identical performance across real-world commercial loan books.
2. **Advisory Decision Support:** Model predictions are statistical decision aids. **CrediWiseAI does not claim that ML probability guarantees legal bank sanction or loan disbursement.**
