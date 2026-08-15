# CrediWiseAI — Kaggle Dataset Integration & Validation Report

> **Status:** Phase 1 Complete (Validation & Feature Preparation Verified)  
> **Source:** Kaggle INR-Native Loan Approval Dataset  
> **Raw File Path:** `data/raw/loan_approval_dataset.csv`  
> **Processed File Path:** `data/processed/loan_approval_processed.csv`  
> **Target Column:** `loan_approved` (`1` = Approved, `0` = Rejected)  
> **Currency Base:** Indian Rupee (INR / ₹) — Native, No Conversion

---

## 1. Executive Summary

In **Phase 1**, the Kaggle loan approval dataset was integrated as the single source of truth for the CrediWiseAI ML pipeline. A deterministic data preparation and validation pipeline was implemented and verified with automated tests. No machine learning models were trained, no model artifacts were generated, and no frontend or backend application code was modified.

---

## 2. Dataset Dimensions & Completeness

| Metric | Raw Dataset (`data/raw/`) | Processed Dataset (`data/processed/`) |
| :--- | :--- | :--- |
| **Total Rows** | 4,269 | 4,269 |
| **Total Columns** | 13 | 24 (13 source + 10 engineered + 1 encoded target) |
| **Duplicate Rows** | 0 | 0 |
| **Duplicate Loan IDs** | 0 | 0 |
| **Missing / Null Values** | 0 (0.00%) | 0 (0.00%) |
| **Infinite Values** | 0 | 0 |
| **File Integrity** | Raw file preserved unchanged | New artifact generated deterministically |

---

## 3. Target Distribution

The ground-truth target `loan_status` was mapped to binary integer `loan_approved`:
- **`1` (Approved):** 2,656 records (**62.22%**)
- **`0` (Rejected):** 1,613 records (**37.78%**)
- **Total Validated Outcomes:** 4,269 records (100.00%)

---

## 4. Anomaly Identification & Recovery

During raw data auditing, a known Kaggle dataset artifact was identified in `residential_assets_value`:
- **Anomaly:** Exactly **28 rows** contained an artificial placeholder value of `-100,000` (`-1 Lakh INR`).
- **Policy Applied:** Following the PRD negative asset policy, only rows matching the exact `-100,000` placeholder were deterministically replaced with `0`.
- **Zero Hallucination:** No synthetic data was generated; no other columns or values were altered.
- **Verification:** Post-cleaning, minimum residential assets value is `₹0`, and no negative values exist across any numeric column in `loan_approval_processed.csv`.

---

## 5. Feature Breakdown & Numerical Distributions

All financial values are strictly Indian Rupees (**INR / ₹**):

| Feature Name | Type | Min | 25% | Median (50%) | Mean | 75% | Max |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `income_annum` | INR | ₹2,00,000 | ₹27,00,000 | ₹51,00,000 | ₹50,59,123.92 | ₹75,00,000 | ₹99,00,000 |
| `loan_amount` | INR | ₹3,00,000 | ₹77,00,000 | ₹1,45,00,000 | ₹1,51,33,450.46 | ₹2,15,00,000 | ₹3,95,00,000 |
| `cibil_score` | Score | 300 | 453 | 600 | 599.94 | 748 | 900 |
| `loan_term` | Years | 2 | 6 | 10 | 10.90 | 16 | 20 |
| `residential_assets_value` | INR | ₹0 | ₹22,00,000 | ₹56,00,000 | ₹74,73,272.43 | ₹1,13,00,000 | ₹2,91,00,000 |
| `commercial_assets_value` | INR | ₹0 | ₹13,00,000 | ₹37,00,000 | ₹49,73,155.31 | ₹76,00,000 | ₹1,94,00,000 |
| `luxury_assets_value` | INR | ₹3,00,000 | ₹75,00,000 | ₹1,46,00,000 | ₹1,51,26,305.93 | ₹2,17,00,000 | ₹3,92,00,000 |
| `bank_asset_value` | INR | ₹0 | ₹23,00,000 | ₹46,00,000 | ₹49,76,692.43 | ₹71,00,000 | ₹1,47,00,000 |
| `total_asset_value` | INR | ₹5,00,000 | ₹1,63,00,000 | ₹3,15,00,000 | ₹3,25,49,426.10 | ₹4,72,00,000 | ₹9,07,00,000 |

---

## 6. Categorical Distributions

### 6.1 Education Level (`education`)
- **Graduate:** 2,144 (50.22%)
- **Not Graduate:** 2,125 (49.78%)

### 6.2 Self Employment Status (`self_employed`)
- **Yes:** 2,150 (50.36%)
- **No:** 2,119 (49.64%)

### 6.3 Number of Dependents (`no_of_dependents`)
- **0:** 712 (16.68%)
- **1:** 697 (16.33%)
- **2:** 708 (16.58%)
- **3:** 727 (17.03%)
- **4:** 752 (17.62%)
- **5:** 673 (15.76%)

### 6.4 Loan Term Distribution in Years (`loan_term`)
- **2 Years:** 404 (9.46%)
- **4 Years:** 447 (10.47%)
- **6 Years:** 490 (11.48%)
- **8 Years:** 386 (9.04%)
- **10 Years:** 436 (10.21%)
- **12 Years:** 456 (10.68%)
- **14 Years:** 405 (9.49%)
- **16 Years:** 412 (9.65%)
- **18 Years:** 422 (9.89%)
- **20 Years:** 411 (9.63%)

---

## 7. Deterministic Engineered Features Summary

| Feature Name | Formula | Min | Median | Max | Financial Interpretation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `monthly_income` | `income_annum / 12` | ₹16,666.67 | ₹4,25,000.00 | ₹8,25,000.00 | Monthly gross cash flow proxy |
| `loan_to_annual_income_ratio` | `loan_amount / income_annum` | 1.50 | 3.00 | 4.00 | Overall leverage multiple |
| `loan_to_monthly_income_ratio` | `loan_amount / monthly_income` | 18.00 | 36.00 | 48.00 | Monthly income debt multiple |
| `total_asset_value` | $\sum \text{Assets}$ | ₹5,00,000 | ₹3,15,00,000 | ₹9,07,00,000 | Total collateral & net worth |
| `asset_to_loan_ratio` | `total_asset_value / loan_amount` | 0.75 | 2.14 | 5.67 | Collateral coverage ratio |
| `bank_asset_to_annual_income_ratio` | `bank_asset_value / income_annum` | 0.00 | 0.97 | 1.50 | Liquid emergency buffer ratio |
| `asset_coverage_ratio` | `total_asset_value / loan_amount` | 0.75 | 2.14 | 5.67 | Solvency safety margin |
| `loan_term_months` | `loan_term * 12` | 24 months | 120 months | 240 months | Total repayment tenure |
| `estimated_principal_monthly_payment` | `loan_amount / loan_term_months` | ₹1,250.00 | ₹1,13,095.24 | ₹16,12,500.00 | Principal-only monthly cash drain proxy |
| `estimated_payment_to_income_ratio` | `estimated_principal_monthly_payment / monthly_income` | 0.075 | 0.275 | 2.00 | Monthly cash flow burden |

---

## 8. Currency & Scope Compliance Attestation

- **INR Native Guarantee:** All financial features (`income_annum`, `loan_amount`, assets, derived cash flows) are strictly in INR (₹).
- **No Currency Multipliers:** Zero USD-to-INR conversions or synthetic multiplier scaling was performed.
- **No Prohibited Features:** Excluded fields (`age`, `marital_status`, `residence_type`, `employment_duration`, `existing_monthly_debt`, `existing_emi`, `credit_history_length`, `previous_loans`, `previous_defaults`) are not present anywhere in the processed dataset or feature contract.
- **Scope Discipline:** No ML models were trained, no `.joblib` files were generated, and no application APIs or frontend components were modified during Phase 1.
