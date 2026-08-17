# CrediWise 🏦 🤖

> **Smart Loan Decision Platform**  
> *Explainable, INR-Native Credit Risk Assessment & Automated Underwriting*

---

## 📌 Project Overview

**CrediWise** is an intelligent loan evaluation platform designed to bridge the gap between complex credit risk modeling and transparent, understandable decision-making for applicants and lenders.

Built around the **Kaggle INR-native Loan Approval Dataset**, the platform provides:
- **Calibrated Approval Predictions:** Machine learning predictions powered by Gradient Boosting (`loan-model-v2.0`).
- **Transparent Factor Attribution:** Actionable explanations highlighting positive and negative factors driving each decision.
- **Interactive What-If Simulation:** Applicant sandbox to test financial adjustments (tenure, down payment, requested principal) under identical ML inference rules.
- **Human-in-the-Loop Governance:** Comprehensive administrative dashboard for application monitoring, audit logging, and manual decision overrides.
- **100% Native INR Financials:** Complete consistency with the Indian monetary context (₹ / Lakhs / Crores).

---

## 🏛️ Project Status

```
[Phase 0: Architecture & Foundation]  <-- CURRENT STATUS (Architecture Locked)
[Phase 1: ML Data Pipeline & Model Training]
[Phase 2: Backend API & Risk Engine]
[Phase 3: Frontend Application & UI Flows]
[Phase 4: Integration, Audit & Verification]
```

> **Note:** The project is currently in **Phase 0 (Architecture & Project Foundation Lock)**. The folder structure, layer responsibilities, schemas, database models, ML contracts, and currency rules are formally locked. Application features and model training will be implemented in subsequent phases.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS, React Router
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite (SQLAlchemy ORM)
- **Machine Learning:** scikit-learn, pandas, numpy, joblib
- **Authentication:** JWT (OAuth2 Bearer Token), bcrypt password hashing, Role-Based Access Control (`user`, `admin`)

---

## 📁 Repository Structure

```
CredWise/
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
├── backend/                  # FastAPI Backend Application
│   ├── app/
│   │   ├── api/              # FastAPI route controllers
│   │   ├── core/             # Configuration & security settings
│   │   ├── db/               # SQLAlchemy engine & session management
│   │   ├── ml/               # ML integration helpers
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic (ML service & Risk engine)
│   │   └── tests/            # Automated test suite
│   ├── requirements.txt      # Backend Python dependencies
│   └── main.py               # Backend entrypoint (Phase 2)
├── data/                     # Datasets
│   ├── raw/                  # Immutable Kaggle loan approval dataset
│   └── processed/            # Cleaned and feature-engineered dataset
├── docs/                     # Architectural and ML documentation
│   ├── ARCHITECTURE.md       # Complete system architecture & contracts
│   ├── DATASET_REPORT.md     # Kaggle dataset specifications & schema
│   └── MODEL_CARD.md         # loan-model-v2.0 specification & governance
├── frontend/                 # React + TypeScript Frontend
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # Global state (AuthContext)
│       ├── pages/            # Application pages
│       ├── services/         # API HTTP services
│       └── types/            # TypeScript type definitions
├── ml/                       # Machine Learning Training Pipeline
│   ├── data_validation.py    # Raw data integrity checks (Phase 1)
│   ├── prepare_data.py       # Deterministic feature engineering (Phase 1)
│   ├── analyze_dataset.py    # Exploratory data analysis (Phase 1)
│   ├── train.py              # Model training & serialization (Phase 1)
│   └── models/               # Serialized model artifacts (.joblib)
├── .env.example              # Template environment variables
├── .gitignore                # Git ignore patterns
└── README.md                 # Project documentation
```

---

## 🚀 Setup & Environment Configuration (Preparation)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm / pnpm
- Git

### 2. Environment Variables
Copy the environment template:
```bash
cp .env.example .env
```

### 3. Backend Setup (Virtual Environment)
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

---

## 📚 Documentation Links
- [System Architecture & Contracts](file:///docs/ARCHITECTURE.md)
- [Dataset Report & Validation Specification](file:///docs/DATASET_REPORT.md)
- [Model Card (loan-model-v2.0)](file:///docs/MODEL_CARD.md)
