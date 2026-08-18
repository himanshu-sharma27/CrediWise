# CrediWiseAI — Exploratory Data Analysis & Leakage Audit Report

> **Dataset:** INR-Native Loan Approval Dataset Augmented with Synthetic Applicant Records  
> **Source Path:** `data/raw/loan_approval_dataset.csv` (10,000 raw) / `data/processed/loan_approval_processed.csv` (9,997 processed)  
> **Records:** 10,000 applicants | **Features:** 20 model features + 1 target (`loan_approved`)  
> **Execution Script:** `ml/analyze_dataset.py`

---

## 1. Target & Class Distribution

The dataset exhibits a clean binary distribution:

### Raw Dataset (10,000 records)
| Outcome | Class | Count | Percentage |
| :--- | :--- | :--- | :--- |
| **Approved** | `1` | 6,227 | **62.27%** |
| **Rejected** | `0` | 3,773 | **37.73%** |
| **Total** | — | 10,000 | **100.00%** |

### Processed Dataset (9,997 usable records)
| Outcome | Class | Count | Percentage |
| :--- | :--- | :--- | :--- |
| **Approved** | `1` | 6,224 | **62.26%** |
| **Rejected** | `0` | 3,773 | **37.74%** |
| **Total** | — | 9,997 | **100.00%** |

---

## 2. Structural & Multicollinearity Audit

### 2.1 Duplicate Feature Detection
An exact pairwise numerical comparison identified one identical feature pair:
- **`asset_coverage_ratio` $\equiv$ `asset_to_loan_ratio`**
- **Action Taken:** `asset_coverage_ratio` was explicitly excluded from the model feature matrix to eliminate duplicate multicollinearity.

### 2.2 Near-Zero Variance Detection
- All 18 numerical features possess sufficient variance across applicant profiles.

### 2.3 Target Leakage Audit
- No features exhibit direct collinearity ($|r| > 0.95$) with the target.
- `loan_id` ($r = -0.0010$) and `loan_status` are excluded from all model inputs.

---

## 3. Univariate & Bivariate Relationships with Loan Approval

### 3.1 Top Feature Correlations with Target
- `cibil_score`: **+0.7230** (Primary driver of approval outcome)
- `loan_amount`: **+0.0147**
- `commercial_assets_value`: **+0.0072**
- `bank_asset_value`: **-0.0057**
- `residential_assets_value`: **-0.0105**
- `no_of_dependents`: **-0.0144**

---

### 3.2 Approval Rates by CIBIL Score Bands

| CIBIL Band | Range | Total Applications | Approval Rate |
| :--- | :--- | :--- | :--- |
| **Sub-550** | $< 550$ | 4,084 | **14.25%** |
| **Fair** | $550 - 649$ | 1,620 | **92.35%** |
| **Good** | $650 - 749$ | 1,793 | **96.71%** |
| **Excellent** | $750 - 900$ | 2,503 | **96.48%** |

---

### 3.3 Approval Rates by Income Bands

- **$\le$ ₹25 Lakhs:** 2,373 apps | **63.80%** approval rate
- **₹25L – ₹50 Lakhs:** 2,575 apps | **61.94%** approval rate
- **₹50L – ₹75 Lakhs:** 2,617 apps | **61.64%** approval rate
- **$>$ ₹75 Lakhs:** 2,435 apps | **61.81%** approval rate

---

### 3.4 Approval Rates by Categorical Demographics

| Category | Group | Application Count | Approval Rate |
| :--- | :--- | :--- | :--- |
| **Education** | Graduate | 5,070 | **62.13%** |
| **Education** | Not Graduate | 4,930 | **62.41%** |
| **Self Employed** | No | 5,025 | **62.83%** |
| **Self Employed** | Yes | 4,975 | **61.71%** |

*Insight: The dataset shows balanced demographic distributions without bias across education or employment categories.*

---

## 4. Key Takeaways for Modeling

1. **Feature Exclusion:** Exclude `loan_id`, `loan_status`, and duplicate `asset_coverage_ratio`.
2. **Dominant Feature:** `cibil_score` is the primary discriminative signal ($r = +0.723$).
3. **Engineering Value:** Engineered ratios (`estimated_payment_to_income_ratio`, `loan_to_annual_income_ratio`) provide critical secondary differentiation for applicants in borderline credit bands.
