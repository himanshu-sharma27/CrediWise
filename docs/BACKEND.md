# CrediWiseAI — Backend & Risk Engine Architecture

> **Service:** FastAPI Backend REST API  
> **Model Target:** `loan-model-v2.0` (`ml/models/loan_model_v2.joblib`)  
> **Target Currency:** Indian Rupee (INR / ₹)  
> **Database:** SQLite with SQLAlchemy ORM  

---

## 1. Architectural Philosophy & Layer Separation

The CrediWiseAI backend is engineered for simplicity, auditability, deterministic monetary calculations, and explainable AI inference:

```
backend/
├── app/
│   ├── api/              # FastAPI route controllers (HTTP & Status mapping only)
│   │   ├── applications.py
│   │   ├── auth.py
│   │   ├── deps.py       # JWT validation & RBAC guards
│   │   ├── eligibility.py
│   │   └── predictions.py
│   ├── core/             # Configuration & Security utilities
│   │   ├── config.py     # Pydantic BaseSettings
│   │   └── security.py   # PBKDF2 hashing & JWT encoding/decoding
│   ├── db/               # SQLAlchemy engine & session lifecycle
│   │   └── session.py
│   ├── models/           # Declarative database entities
│   │   └── models.py
│   ├── schemas/          # Pydantic v2 validation contracts
│   │   └── schemas.py
│   ├── services/         # Pure business logic & inference engines
│   │   ├── ml_service.py # Feature engineering & model execution
│   │   └── risk_engine.py# Financial health & multidimensional risk evaluation
│   └── tests/            # Automated test suite (Pytest)
└── requirements.txt      # Python dependencies
```

---

## 2. Machine Learning Pipeline Integration

Real-time model inference is encapsulated entirely within `backend/app/services/ml_service.py`:

1. **Model Cache (`load_model_artifact`):**
   - The production Gradient Boosting pipeline (`loan_model_v2.joblib`) is loaded into memory on startup and cached across requests for sub-10ms inference.
2. **Deterministic Feature Engineering:**
   - Evaluates the 10 derived features in Indian Rupees without frontend dependencies or training discrepancies:
     - $\text{monthly\_income} = \frac{\text{income\_annum}}{12}$
     - $\text{loan\_to\_annual\_income\_ratio} = \frac{\text{loan\_amount}}{\text{income\_annum}}$
     - $\text{loan\_to\_monthly\_income\_ratio} = \frac{\text{loan\_amount}}{\text{monthly\_income}}$
     - $\text{total\_asset\_value} = \text{residential} + \text{commercial} + \text{luxury} + \text{bank}$
     - $\text{asset\_to\_loan\_ratio} = \frac{\text{total\_asset\_value}}{\text{loan\_amount}}$
     - $\text{bank\_asset\_to\_annual\_income\_ratio} = \frac{\text{bank\_asset\_value}}{\text{income\_annum}}$
     - $\text{loan\_term\_months} = \text{loan\_term} \times 12$
     - $\text{estimated\_principal\_monthly\_payment} = \frac{\text{loan\_amount}}{\text{loan\_term\_months}}$
     - $\text{estimated\_payment\_to\_income\_ratio} = \frac{\text{estimated\_principal\_monthly\_payment}}{\text{monthly\_income}}$
3. **Local Factor Attribution:**
   - Computes ranked positive and negative factors influencing the approval decision by comparing applicant values against empirical population baselines and feature importance weights.

---

## 3. Risk Assessment Engine

Located in `backend/app/services/risk_engine.py`, the risk engine computes a composite **Financial Health Score (0-100)** and categorizes risk into **`LOW`**, **`MEDIUM`**, or **`HIGH`** across 4 key pillars:
- **Credit Strength (40 pts):** CIBIL score tiering (Prime $\ge 750$, Good $\ge 700$, Fair $\ge 650$, Borderline $\ge 550$, Sub-Prime $< 550$).
- **Repayment Capacity (30 pts):** Payment-to-income burden ($\le 25\%$, $\le 40\%$, $\le 55\%$, $> 55\%$).
- **Asset Coverage (20 pts):** Collateral backing ($\ge 200\%$, $\ge 100\%$, $\ge 50\%$, $< 50\%$).
- **Liquidity Cushion (10 pts):** Liquid bank savings relative to annual income ($\ge 40\%$, $\ge 15\%$, $< 15\%$).

---

## 4. Security & Role-Based Access Control (RBAC)

1. **Authentication:**
   - Stateless JWT tokens with 24-hour expiry (`HS256`).
   - Passwords hashed using PBKDF2-HMAC-SHA256 (30,000 rounds).
2. **Access Isolation:**
   - `deps.get_current_user`: Verifies active user from bearer token.
   - `deps.require_user`: Ensures applicant role.
   - `deps.require_admin`: Strictly requires `role == "admin"`.
   - Application ownership is verified on every single-application endpoint, preventing User A from inspecting or predicting User B's records.

---

## 5. Running the Backend & Tests

### Running the API Server Locally
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Running the Complete Test Suite
```bash
python -m pytest backend/app/tests -v
```
All unit, integration, and security tests run against isolated in-memory SQLite instances.
