# CrediWiseAI — Dataset Integration & Validation Report

> **Status:** Verified & Integrated  
> **Source:** INR-Native Loan Approval Dataset Augmented with Synthetic Applicant Records  
> **Raw File Path:** `data/raw/loan_approval_dataset.csv`  
> **Processed File Path:** `data/processed/loan_approval_processed.csv`  
> **Target Column:** `loan_approved` (`1` = Approved, `0` = Rejected)  
> **Currency Base:** Indian Rupee (INR / ₹) — Native, No Conversion

---

## 1. Executive Summary

CrediWise uses the original INR-native loan approval dataset augmented with synthetic applicant records. A deterministic data preparation and validation pipeline cleans the raw input, handles known dataset artifacts, excludes non-trainable zero-income records, and computes 10 engineered financial ratios in Indian Rupees.

---

## 2. Dataset Dimensions & Completeness

| Metric | Raw Dataset (`data/raw/`) | Processed Dataset (`data/processed/`) |
| :--- | :--- | :--- |
| **Total Rows** | 10,000 | 9,997 |
| **Total Columns** | 13 | 24 (13 source + 10 engineered + 1 encoded target) |
| **Duplicate Rows** | 0 | 0 |
| **Duplicate Loan IDs** | 0 | 0 |
| **Missing / Null Values** | 0 (0.00%) | 0 (0.00%) |
| **Infinite Values** | 0 | 0 |
| **Excluded Rows** | 0 | 3 rows (income_annum = 0 excluded from training) |
| **File Integrity** | Raw file preserved unchanged | Processed artifact generated deterministically |

---

## 3. Target Distribution

The ground-truth target `loan_status` is mapped to binary integer `loan_approved`:

### Raw Dataset (10,000 records)
- **`Approved`:** 6,227 records (**62.27%**)
- **`Rejected`:** 3,773 records (**37.73%**)

### Processed Training Dataset (9,997 records)
- **`1` (Approved):** 6,224 records (**62.26%**)
- **`0` (Rejected):** 3,773 records (**37.74%**)
- **Total Usable Records:** 9,997 records (100.00%)

---

## 4. Anomaly Identification & Recovery

1. **Zero-Income Rows:**
   - Exactly **3 rows** in the raw dataset had `income_annum == 0`.
   - Because income-based engineered features (`monthly_income`, `loan_to_annual_income_ratio`, `loan_to_monthly_income_ratio`, `bank_asset_to_annual_income_ratio`, `estimated_payment_to_income_ratio`) require a strictly positive denominator, these 3 rows are excluded from the processed training dataset.

2. **Residential Assets Placeholder:**
   - Exactly **28 rows** contained an artificial placeholder value of `-100,000` (`-1 Lakh INR`).
   - Following standard negative asset policy, only rows matching the exact `-100,000` placeholder were deterministically replaced with `0`.
   - Post-cleaning, minimum residential assets value is `₹0`, and no negative values exist across any numeric column in `loan_approval_processed.csv`.

---

## 5. Feature Breakdown & Numerical Distributions

All financial values are strictly Indian Rupees (**INR / ₹**):

| Feature Name | Type | Min | Max | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| `income_annum` | INR | ₹1,00,000 | ₹1,06,00,000 | Gross annual applicant earnings |
| `loan_amount` | INR | ₹1,00,000 | ₹4,16,00,000 | Requested principal loan amount |
| `cibil_score` | Score | 300 | 900 | Credit bureau score |
| `loan_term` | Years | 1 | 20 | Repayment tenure in years |
| `residential_assets_value` | INR | ₹0 | ₹2,91,00,000 | Residential real estate valuation |
| `commercial_assets_value` | INR | ₹0 | ₹1,94,00,000 | Commercial property valuation |
| `luxury_assets_value` | INR | ₹3,00,000 | ₹3,92,00,000 | Luxury assets valuation |
| `bank_asset_value` | INR | ₹0 | ₹1,47,00,000 | Liquid bank deposits and savings |
| `total_asset_value` | INR | ₹5,00,000 | ₹9,07,00,000 | Total declared asset base |

---

## 6. Categorical Distributions (Raw Dataset)

### 6.1 Education Level (`education`)
- **Graduate:** 5,070 (50.70%)
- **Not Graduate:** 4,930 (49.30%)

### 6.2 Self Employment Status (`self_employed`)
- **No (Salaried):** 5,025 (50.25%)
- **Yes (Self-Employed):** 4,975 (49.75%)

---

## 7. Deterministic Engineered Features Summary

| Feature Name | Formula | Financial Interpretation |
| :--- | :--- | :--- |
| `monthly_income` | `income_annum / 12` | Monthly gross cash flow proxy |
| `loan_to_annual_income_ratio` | `loan_amount / income_annum` | Overall leverage multiple |
| `loan_to_monthly_income_ratio` | `loan_amount / monthly_income` | Monthly income debt multiple |
| `total_asset_value` | $\sum \text{Assets}$ | Total collateral & net worth |
| `asset_to_loan_ratio` | `total_asset_value / loan_amount` | Collateral coverage ratio |
| `bank_asset_to_annual_income_ratio` | `bank_asset_value / income_annum` | Liquid emergency buffer ratio |
| `asset_coverage_ratio` | `total_asset_value / loan_amount` | Solvency safety margin |
| `loan_term_months` | `loan_term * 12` | Total repayment tenure in months |
| `estimated_principal_monthly_payment` | `loan_amount / loan_term_months` | Principal-only monthly cash drain proxy |
| `estimated_payment_to_income_ratio` | `estimated_principal_monthly_payment / monthly_income` | Monthly debt burden ratio |

---

## 8. Currency & Scope Compliance Attestation

- **INR Native Guarantee:** All financial features are strictly in INR (₹).
- **No Currency Multipliers:** Zero USD-to-INR conversions or arbitrary scaling.
- **No Prohibited Features:** Excluded fields (`age`, `marital_status`, `residence_type`, `employment_duration`, `existing_monthly_debt`, `existing_emi`, `credit_history_length`, `previous_loans`, `previous_defaults`) are not present in the model feature contract.
