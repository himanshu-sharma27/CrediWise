# CrediWiseAI — REST API Specification

> **Version:** 2.0.0  
> **Base URL:** `/api/v1`  
> **Target Currency:** Indian Rupee (INR / ₹)  
> **Model Version:** `loan-model-v2.0` (Gradient Boosting Classifier)

---

## 1. Overview & Authentication

CrediWiseAI exposes a stateless RESTful API adhering strictly to the **11 Kaggle INR-Native Features** and Role-Based Access Control (RBAC).

### Authentication Scheme
- **Standard:** HTTP Bearer Token (`OAuth2PasswordBearer`)
- **Format:** JSON Web Token (JWT) signed with HMAC-SHA256
- **Header:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Token Validity:** 24 Hours (1440 minutes)

### Roles & Permissions
- **`user`**: Standard applicant. Can create personal applications, view personal prediction history, execute real-time What-If simulations, and inspect personal profile.
- **`admin`**: Loan officer / auditor. Can list all applications across all users, inspect any application prediction, and perform audit queries.

---

## 2. Strict Kaggle INR-Native Feature Contract

All loan application submissions and simulator requests require the following 11 canonical features:

| Field Name | Type | Allowed Values / Range | Description |
| :--- | :--- | :--- | :--- |
| `no_of_dependents` | Integer | `0` to `20` | Number of financially dependent family members |
| `education` | String | `"Graduate"`, `"Not Graduate"` | Applicant formal educational qualification |
| `self_employed` | String | `"Yes"`, `"No"` | Employment classification (`"Yes"` = Self-Employed, `"No"` = Salaried) |
| `income_annum` | Float | `> 0` (INR) | Gross annual earnings in Indian Rupees |
| `loan_amount` | Float | `> 0` (INR) | Requested loan principal in Indian Rupees |
| `loan_term` | Integer | `1` to `40` (Years) | Repayment tenure in years |
| `cibil_score` | Integer | `300` to `900` | Credit bureau score |
| `residential_assets_value` | Float | `≥ 0` (INR) | Market value of residential properties |
| `commercial_assets_value` | Float | `≥ 0` (INR) | Market value of commercial properties |
| `luxury_assets_value` | Float | `≥ 0` (INR) | Market value of luxury items (vehicles, art, jewelry) |
| `bank_asset_value` | Float | `≥ 0` (INR) | Liquid deposits, savings, and mutual funds |

> [!IMPORTANT]
> **Prohibited Legacy Fields:** `previous_defaults`, `credit_history_length`, `existing_emi`, `marital_status`, `residence_type`, and `employment_duration` are strictly excluded from the schema.

---

## 3. Endpoints Directory

### 3.1 System & Health

#### `GET /api/v1/health`
Checks backend and ML artifact operational status.

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "project": "CrediWise - Smart Loan Decision Platform",
  "model_version": "loan-model-v2.0",
  "model_loaded": true,
  "database": "SQLite",
  "currency": "INR",
  "timestamp": "2026-08-15T12:00:00.000000Z"
}
```

---

### 3.2 Eligibility & Guidelines

#### `GET /api/v1/eligibility/rules`
Returns public underwriting criteria and benchmark distributions.

**Response (`200 OK`):**
```json
{
  "currency": "INR",
  "currency_symbol": "₹",
  "model_version": "loan-model-v2.0",
  "algorithm": "Gradient Boosting Classifier (Calibrated)",
  "features": [
    {
      "field_name": "income_annum",
      "display_name": "Annual Gross Income",
      "type": "Numeric (INR)",
      "description": "Total verified annual earnings from all sources.",
      "benchmark_or_range": "₹2,00,000 to ₹1,00,00,000+ per annum"
    }
  ],
  "cibil_score_guide": {
    "750 - 900": "Prime Tier: Optimal approval odds and favorable terms.",
    "700 - 749": "Good Tier: High probability of approval.",
    "650 - 699": "Fair Tier: Moderate approval probability.",
    "550 - 649": "Borderline: Requires strong collateral.",
    "300 - 549": "Sub-Prime: High default risk."
  },
  "disclaimer": "CrediWiseAI provides AI-assisted credit scoring recommendations."
}
```

---

### 3.3 Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
Creates a new applicant account with `role="user"`.

**Request Body:**
```json
{
  "name": "Aarav Gupta",
  "email": "aarav.gupta@example.com",
  "password": "SecurePassword@123"
}
```

**Response (`201 Created`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Aarav Gupta",
    "email": "aarav.gupta@example.com",
    "role": "user",
    "is_active": true,
    "created_at": "2026-08-15T12:00:00Z"
  }
}
```

#### `POST /api/v1/auth/login`
Authenticates credentials and returns a signed JWT token.

**Request Body:**
```json
{
  "email": "aarav.gupta@example.com",
  "password": "SecurePassword@123"
}
```

#### `GET /api/v1/auth/me`
Retrieves current authenticated user's profile. Requires `Authorization: Bearer <TOKEN>`.

---

### 3.4 Loan Applications (`/api/v1/applications`)

#### `POST /api/v1/applications`
Creates a formal loan application bound to the authenticated user.

**Request Body:**
```json
{
  "applicant_name": "Aarav Gupta",
  "no_of_dependents": 2,
  "education": "Graduate",
  "self_employed": "No",
  "income_annum": 1500000.0,
  "loan_amount": 3500000.0,
  "loan_term": 15,
  "cibil_score": 780,
  "residential_assets_value": 4000000.0,
  "commercial_assets_value": 1500000.0,
  "luxury_assets_value": 800000.0,
  "bank_asset_value": 1200000.0
}
```

**Response (`201 Created`):**
```json
{
  "id": 1,
  "application_number": "APP-202608-A1B2C3D4",
  "user_id": 1,
  "applicant_name": "Aarav Gupta",
  "no_of_dependents": 2,
  "education": "Graduate",
  "self_employed": "No",
  "income_annum": 1500000.0,
  "loan_amount": 3500000.0,
  "loan_term": 15,
  "cibil_score": 780,
  "residential_assets_value": 4000000.0,
  "commercial_assets_value": 1500000.0,
  "luxury_assets_value": 800000.0,
  "bank_asset_value": 1200000.0,
  "status": "UNDER_REVIEW",
  "created_at": "2026-08-15T12:00:00Z",
  "updated_at": "2026-08-15T12:00:00Z",
  "latest_prediction": null
}
```

#### `GET /api/v1/applications/me`
Retrieves all applications submitted by the current authenticated user.

#### `GET /api/v1/applications/{app_id}`
Retrieves a single application by ID (enforcing user ownership or admin authorization).

#### `GET /api/v1/applications` *(Admin Only)*
Retrieves all applications across all users.

---

### 3.5 Predictions & What-If Simulator (`/api/v1/predictions`)

#### `POST /api/v1/predictions/applications/{app_id}`
Runs the `loan-model-v2.0` inference pipeline on a stored application, persists prediction results and factor explanations, updates application status (`APPROVED` or `REJECTED`), and records audit logs.

**Response (`200 OK`):**
```json
{
  "id": 1,
  "application_id": 1,
  "model_version": "loan-model-v2.0",
  "recommendation": "APPROVED",
  "advisory_recommendation": "APPROVE",
  "approval_probability": 0.942,
  "risk_level": "LOW",
  "inference_latency_ms": 3.42,
  "derived_indicators": {
    "monthly_income": 125000.0,
    "loan_to_annual_income_ratio": 2.333,
    "loan_to_monthly_income_ratio": 28.0,
    "total_asset_value": 7500000.0,
    "asset_to_loan_ratio": 2.143,
    "bank_asset_to_annual_income_ratio": 0.8,
    "loan_term_months": 180,
    "estimated_principal_monthly_payment": 19444.44,
    "estimated_payment_to_income_ratio": 0.156
  },
  "risk_assessment": {
    "risk_level": "LOW",
    "credit_strength": "Prime Credit (Exceptional)",
    "repayment_capacity": "Strong (Low Burden <= 25%)",
    "asset_coverage": "High (Asset Backing >= 200%)",
    "financial_health_score": 94.0,
    "summary": "Favorable credit profile with strong repayment capacity and solid collateral cushion.",
    "positive_factors": [
      "Strong CIBIL score (780) indicates reliable repayment history.",
      "Comfortable monthly debt burden (15.6% of income)."
    ],
    "risk_factors": []
  },
  "explanations": [
    {
      "feature_name": "cibil_score",
      "display_name": "Credit Bureau Score (CIBIL)",
      "impact": "POSITIVE",
      "direction": "INCREASES_APPROVAL",
      "rank": 1,
      "explanation_text": "CIBIL Score of 780 is well above prime benchmark (700+), significantly boosting approval likelihood."
    }
  ],
  "created_at": "2026-08-15T12:00:00Z"
}
```

#### `POST /api/v1/predictions/simulator` *(Alias: `/simulate`)*
Runs real-time What-If scenario inference on the exact same ML pipeline without database persistence.

---

## 4. HTTP Status Code Mapping

| Status Code | Description | Scenario |
| :--- | :--- | :--- |
| `200 OK` | Success | Query, prediction generation, or simulation success |
| `201 Created` | Created | Application creation, user registration |
| `400 Bad Request` | Client Error | Deactivated account or invalid request logic |
| `401 Unauthorized` | Auth Failed | Missing, invalid, or expired JWT token |
| `403 Forbidden` | Access Denied | Standard user accessing admin route or another user's application |
| `404 Not Found` | Resource Missing | Application ID does not exist |
| `409 Conflict` | Resource Exists | Registration with an email that is already registered |
| `422 Unprocessable`| Validation Error | Pydantic boundary validation error (e.g. invalid CIBIL or negative income) |
