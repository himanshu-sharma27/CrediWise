# CrediWise 🏦 🤖

> **Smart Loan Decision Platform**  
> *Explainable, INR-Native Credit Risk Assessment & Automated Underwriting*

[![CrediWise CI](https://github.com/himanshu-sharma27/CrediWise/actions/workflows/ci.yml/badge.svg)](https://github.com/himanshu-sharma27/CrediWise/actions/workflows/ci.yml)

---

## 📌 Project Overview

**CrediWise** is an intelligent loan evaluation platform designed to bridge the gap between complex credit risk modeling and transparent, understandable decision-making for applicants and lenders.

Built around the **INR-native Loan Approval Dataset augmented with synthetic applicant records**, the platform provides:
- **Calibrated Approval Predictions:** Machine learning predictions powered by Random Forest (`loan-model-v2.1-synthetic-10000`).
- **Transparent Factor Attribution:** Actionable explanations highlighting positive and negative factors driving each decision.
- **Interactive What-If Simulation:** Applicant sandbox to test financial adjustments (tenure, down payment, requested principal) under identical ML inference rules.
- **Human-in-the-Loop Governance:** Comprehensive administrative dashboard for application monitoring, audit logging, and manual decision overrides.
- **100% Native INR Financials:** Complete consistency with the Indian monetary context (₹ / Lakhs / Crores).

---

## 🏛️ Project Status

```
[Phase 0: Architecture & Foundation]
[Phase 1: ML Data Pipeline & Model Training]
[Phase 2: Backend API & Risk Engine]
[Phase 3: Frontend Application & UI Flows]
[Phase 4: Integration, Audit & Verification]  <-- CURRENT STATUS (Active & Verified)
```

> **Note:** CrediWise uses the original INR-native loan approval dataset augmented with synthetic applicant records. After deterministic preprocessing, the resulting training dataset contains approximately 9,997 usable records.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS, React Router
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite / PostgreSQL (SQLAlchemy ORM)
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
│   └── main.py               # Backend entrypoint
├── data/                     # Datasets
│   ├── raw/                  # Augmented loan approval dataset (10,000 records)
│   └── processed/            # Cleaned and feature-engineered dataset (9,997 records)
├── docs/                     # Architectural and ML documentation
│   ├── ARCHITECTURE.md       # Complete system architecture & contracts
│   ├── DATASET_REPORT.md     # Dataset specifications & schema
│   ├── EDA_REPORT.md         # Exploratory data analysis & audit
│   ├── MODEL_CARD.md         # loan-model-v2.1-synthetic-10000 specification & governance
│   ├── MODEL_COMPARISON.md   # Candidate model benchmark comparison & selection
│   └── MODEL_EXPLAINABILITY.md # Factor attribution & explainability report
├── frontend/                 # React + TypeScript Frontend
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # Global state (AuthContext)
│       ├── pages/            # Application pages
│       ├── services/         # API HTTP services
│       └── types/            # TypeScript type definitions
├── ml/                       # Machine Learning Training Pipeline
│   ├── prepare_data.py       # Deterministic feature engineering
│   ├── analyze_dataset.py    # Exploratory data analysis
│   ├── train.py              # Model training, comparison & serialization
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
- [Exploratory Data Analysis Report](file:///docs/EDA_REPORT.md)
- [Model Card (loan-model-v2.1-synthetic-10000)](file:///docs/MODEL_CARD.md)
- [Model Comparison & Benchmark Report](file:///docs/MODEL_COMPARISON.md)
- [Model Explainability & Factor Attribution](file:///docs/MODEL_EXPLAINABILITY.md)
