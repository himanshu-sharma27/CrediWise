# CrediWiseAI — Exploratory Data Analysis & Leakage Audit Report

> **Dataset:** Validated Kaggle INR-Native Loan Approval Dataset  
> **Source Path:** `data/processed/loan_approval_processed.csv`  
> **Records:** 4,269 applicants | **Features:** 20 model features + 1 target (`loan_approved`)  
> **Execution Script:** `ml/analyze_dataset.py`

---

## 1. Target & Class Distribution

The dataset exhibits a clean binary distribution with moderate class balance:

| Outcome | Class | Count | Percentage |
| :--- | :--- | :--- | :--- |
| **Approved** | `1` | 2,656 | **62.22%** |
| **Rejected** | `0` | 1,613 | **37.78%** |
| **Total** | — | 4,269 | **100.00%** |

---

## 2. Structural & Multicollinearity Audit

### 2.1 Duplicate Feature Detection
An exact pairwise numerical comparison identified one identical feature pair:
- **`asset_coverage_ratio` $\equiv$ `asset_to_loan_ratio`**
- **Analysis:** Both features were computed as $\frac{\text{total\_asset\_value}}{\text{loan\_amount}}$.
- **Action Taken:** `asset_coverage_ratio` was explicitly excluded from the model feature matrix to eliminate duplicate multicollinearity.

### 2.2 Near-Zero Variance Detection
- No features had variance below $10^{-4}$. All 18 numerical features possess sufficient variance across applicant profiles.

### 2.3 Target Leakage Audit
- No features (other than `loan_status` / `loan_approved`) exhibit direct collinearity ($|r| > 0.95$) with the target.
- `loan_id` ($r = +0.0177$) and `loan_status` are excluded from all model inputs.

---

## 3. Univariate & Bivariate Relationship with Loan Approval

### 3.1 Top Feature Correlations with `loan_approved`

| Feature | Pearson Correlation ($r$) | Description |
| :--- | :--- | :--- |
| **`cibil_score`** | **+0.7705** | Primary driver of approval outcome |
| **`estimated_payment_to_income_ratio`** | **+0.1831** | Monthly debt burden metric |
| **`estimated_principal_monthly_payment`** | **+0.1255** | Principal drain proxy |
| **`loan_to_monthly_income_ratio`** | **+0.0877** | Monthly leverage multiple |
| **`loan_to_annual_income_ratio`** | **+0.0877** | Annual leverage multiple |
| **`total_asset_value`** | **-0.0532** | Aggregate collateral backing |
| **`asset_to_loan_ratio`** | **+0.0142** | Collateral-to-principal ratio |

---

### 3.2 Approval Rates by CIBIL Score Bands

The dataset demonstrates a sharp non-linear step-function threshold centered around CIBIL score $\approx 550$:

| CIBIL Band | Range | Total Applications | Approved Count | Approval Rate |
| :--- | :--- | :--- | :--- | :--- |
| **Poor** | $300 - 549$ | 1,789 | 189 | **10.56%** |
| **Fair** | $550 - 649$ | 688 | 686 | **99.71%** |
| **Good** | $650 - 749$ | 739 | 734 | **99.32%** |
| **Excellent** | $750 - 900$ | 1,053 | 1,047 | **99.43%** |

> [!WARNING]
> **Dataset Characteristic:** The Kaggle dataset uses CIBIL score $\ge 550$ as an almost deterministic threshold for approval. Above 550, approval rates exceed 99.3%.

---

### 3.3 Approval Rates by Income & Leverage Bands

#### Income Bands (Annual INR)
- **$\le$ ₹25 Lakhs:** 1,073 apps | **61.88%** approval rate
- **₹25L – ₹50 Lakhs:** 1,009 apps | **62.24%** approval rate
- **₹50L – ₹75 Lakhs:** 1,080 apps | **62.59%** approval rate
- **$>$ ₹75 Lakhs:** 1,107 apps | **62.15%** approval rate

*Insight: Gross income alone has virtually zero correlation with approval in this dataset; approval is mediated through CIBIL score and debt ratios.*

#### Loan-to-Income Multiple (LTI)
- **Low ($\le 2.0\times$):** 460 apps | **59.35%** approval rate
- **Moderate ($2.0 - 3.0\times$):** 1,677 apps | **61.12%** approval rate
- **High ($3.0 - 3.5\times$):** 967 apps | **64.74%** approval rate
- **Very High ($> 3.5\times$):** 1,165 apps | **62.83%** approval rate

---

### 3.4 Approval Rates by Categorical Demographics

| Category | Group | Application Count | Approval Rate |
| :--- | :--- | :--- | :--- |
| **Education** | Graduate | 2,144 | **62.45%** |
| **Education** | Not Graduate | 2,125 | **61.98%** |
| **Self Employed** | No | 2,119 | **62.20%** |
| **Self Employed** | Yes | 2,150 | **62.23%** |

*Insight: The dataset shows no demographic bias across education or employment status.*

---

## 4. Key Takeaways for Modeling

1. **Feature Exclusion:** Exclude `loan_id`, `loan_status`, and duplicate `asset_coverage_ratio`.
2. **Dominant Feature:** `cibil_score` is the primary discriminative signal ($r = +0.77$). Tree-based models are expected to capture this step-function boundary cleanly.
3. **Engineering Value:** Engineered leverage and payment burden ratios (`estimated_payment_to_income_ratio`, `loan_to_annual_income_ratio`) provide secondary refinement for borderline applications.
