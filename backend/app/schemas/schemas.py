"""CrediWiseAI - Pydantic Request & Response Schemas.

Validates all API inputs strictly against the Kaggle INR dataset boundaries
and defines clean serialization schemas for responses.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ==========================================
# Authentication Schemas
# ==========================================

class UserRegisterRequest(BaseModel):
    """Payload for public user registration. Always creates role='user'."""
    name: str = Field(..., min_length=2, max_length=100, description="Full applicant name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, max_length=100, description="Plain text password")


class UserLoginRequest(BaseModel):
    """Payload for authenticating user or admin."""
    email: EmailStr = Field(..., description="User registered email")
    password: str = Field(..., min_length=1, max_length=100, description="Account password")


class UserResponse(BaseModel):
    """Safe user profile response excluding password hashes."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class AuthResponse(BaseModel):
    """Authentication response payload containing JWT token and user profile."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Extracted payload from verified JWT."""
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None


# ==========================================
# ML Feature & Indicator Schemas
# ==========================================

class MLFeatureInputBase(BaseModel):
    """Strict validation for the 11 Kaggle INR-native source features."""
    no_of_dependents: int = Field(
        ..., ge=0, le=20, description="Number of financial dependents"
    )
    education: Literal["Graduate", "Not Graduate"] = Field(
        ..., description="Applicant educational qualification"
    )
    self_employed: Literal["Yes", "No"] = Field(
        ..., description="Self-employment status"
    )
    income_annum: float = Field(
        ..., gt=0, description="Annual gross income in Indian Rupees (INR)"
    )
    loan_amount: float = Field(
        ..., gt=0, description="Requested principal loan amount in Indian Rupees (INR)"
    )
    loan_term: int = Field(
        ..., ge=1, le=40, description="Requested loan tenure in years"
    )
    cibil_score: int = Field(
        ..., ge=300, le=900, description="Credit bureau score (300 - 900)"
    )
    residential_assets_value: float = Field(
        ..., ge=0, description="Residential real estate market value (INR)"
    )
    commercial_assets_value: float = Field(
        ..., ge=0, description="Commercial real estate market value (INR)"
    )
    luxury_assets_value: float = Field(
        ..., ge=0, description="Luxury assets (vehicles, jewelry, art) value (INR)"
    )
    bank_asset_value: float = Field(
        ..., ge=0, description="Liquid bank deposits, savings, and mutual funds (INR)"
    )

    @field_validator("education", mode="before")
    @classmethod
    def clean_education(cls, v: str) -> str:
        cleaned = str(v).strip()
        if cleaned not in {"Graduate", "Not Graduate"}:
            raise ValueError("education must be either 'Graduate' or 'Not Graduate'")
        return cleaned

    @field_validator("self_employed", mode="before")
    @classmethod
    def clean_self_employed(cls, v: str) -> str:
        cleaned = str(v).strip()
        if cleaned not in {"Yes", "No"}:
            raise ValueError("self_employed must be either 'Yes' or 'No'")
        return cleaned


class DerivedIndicatorsSchema(BaseModel):
    """Deterministic mathematical indicators derived from raw features."""
    monthly_income: float = Field(..., description="Monthly income in INR (income_annum / 12)")
    loan_to_annual_income_ratio: float = Field(..., description="Loan to Annual Income Ratio")
    loan_to_monthly_income_ratio: float = Field(..., description="Loan to Monthly Income Ratio")
    total_asset_value: float = Field(..., description="Sum of 4 asset categories (INR)")
    asset_to_loan_ratio: float = Field(..., description="Total Asset to Loan Ratio")
    bank_asset_to_annual_income_ratio: float = Field(..., description="Bank Asset to Annual Income Ratio")
    loan_term_months: int = Field(..., description="Tenure in months (loan_term * 12)")
    estimated_principal_monthly_payment: float = Field(
        ..., description="Principal monthly payment in INR (loan_amount / loan_term_months)"
    )
    estimated_payment_to_income_ratio: float = Field(
        ..., description="Estimated payment to monthly income ratio"
    )


class FactorExplanationSchema(BaseModel):
    """Transparent factor contribution item."""
    model_config = ConfigDict(from_attributes=True)

    feature_name: str
    display_name: str
    impact: str  # "POSITIVE" | "NEGATIVE" | "NEUTRAL"
    direction: str  # "INCREASES_APPROVAL" | "DECREASES_APPROVAL"
    rank: int
    explanation_text: str


class RiskAssessmentSchema(BaseModel):
    """Comprehensive risk breakdown and financial health assessment."""
    risk_level: str  # "LOW" | "MEDIUM" | "HIGH"
    credit_strength: str
    repayment_capacity: str
    asset_coverage: str
    financial_health_score: float  # 0 to 100
    summary: str
    positive_factors: List[str]
    risk_factors: List[str]
    estimated_eligible_loan_amount: Optional[float] = None


# ==========================================
# Loan Application Schemas
# ==========================================

class LoanApplicationCreateRequest(MLFeatureInputBase):
    """Request payload for creating a formal loan application."""
    applicant_name: str = Field(..., min_length=2, max_length=100, description="Full applicant name")


class LoanApplicationResponse(BaseModel):
    """Full loan application details returned by API."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_number: str
    user_id: int
    applicant_name: str
    no_of_dependents: int
    education: str
    self_employed: str
    income_annum: float
    loan_amount: float
    loan_term: int
    cibil_score: int
    residential_assets_value: float
    commercial_assets_value: float
    luxury_assets_value: float
    bank_asset_value: float
    status: str
    created_at: datetime
    updated_at: datetime
    latest_prediction: Optional[PredictionResponse] = None


class LoanApplicationListResponse(BaseModel):
    """List container for loan applications."""
    total: int
    applications: List[LoanApplicationResponse]


# ==========================================
# Prediction & Simulator Schemas
# ==========================================

class PredictionResponse(BaseModel):
    """Standard prediction response for an application or simulator run."""
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    application_id: Optional[int] = None
    model_version: str
    recommendation: str  # "APPROVED" | "REJECTED"
    advisory_recommendation: Optional[str] = None  # "APPROVE" | "MANUAL_REVIEW" | "REJECT"
    approval_probability: float
    risk_level: str  # "LOW" | "MEDIUM" | "HIGH"
    inference_latency_ms: float
    derived_indicators: DerivedIndicatorsSchema
    risk_assessment: RiskAssessmentSchema
    explanations: List[FactorExplanationSchema]
    created_at: Optional[datetime] = None


class SimulatorRequestSchema(MLFeatureInputBase):
    """Request payload for What-If scenario simulation without DB persistence."""
    pass


class SimulatorResponseSchema(BaseModel):
    """What-If scenario simulation response with identical ML inference results."""
    model_version: str
    recommendation: str
    advisory_recommendation: str
    approval_probability: float
    risk_level: str
    inference_latency_ms: float
    derived_indicators: DerivedIndicatorsSchema
    risk_assessment: RiskAssessmentSchema
    explanations: List[FactorExplanationSchema]
    input_summary: Dict[str, Any]


class PredictionHistoryItem(BaseModel):
    """Summary item for user prediction history."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: Optional[int]
    model_version: str
    recommendation: str
    approval_probability: float
    risk_level: str
    inference_latency_ms: float
    created_at: datetime


# ==========================================
# Eligibility & Health Schemas
# ==========================================

class EligibilityRuleItem(BaseModel):
    """Information item describing a Kaggle dataset feature and benchmark."""
    field_name: str
    display_name: str
    type: str
    description: str
    benchmark_or_range: str


class EligibilityRulesResponse(BaseModel):
    """Public guidelines and criteria based strictly on the Kaggle INR dataset."""
    currency: str = "INR"
    currency_symbol: str = "₹"
    model_version: str
    algorithm: str
    features: List[EligibilityRuleItem]
    cibil_score_guide: Dict[str, str]
    disclaimer: str


class HealthCheckResponse(BaseModel):
    """System health check response."""
    status: str = "ok"
    project: str
    model_version: str
    model_loaded: bool
    database: str
    currency: str = "INR"
    timestamp: datetime


# ==========================================
# Administrator & Analytics Schemas
# ==========================================

class AdminUserSummary(BaseModel):
    """Summary item for administrative user directory."""
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    application_count: int = 0


class AdminUsersListResponse(BaseModel):
    """List of users returned by admin user management endpoint."""
    total: int
    users: List[AdminUserSummary]


class AdminDashboardResponse(BaseModel):
    """Executive KPI and portfolio overview for administrator dashboard."""
    total_applications: int
    approved_applications: int
    rejected_applications: int
    under_review_applications: int
    approval_rate: float
    total_requested_loan_amount: float
    average_loan_amount: float
    average_cibil_score: float
    risk_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    recent_applications: List[LoanApplicationResponse]


class AdminAnalyticsResponse(BaseModel):
    """Aggregated portfolio distributions and risk analytics."""
    total_applications: int
    approved_count: int
    rejected_count: int
    under_review_count: int
    approval_rate: float
    rejection_rate: float
    cibil_bands: Dict[str, int]
    loan_amount_bands: Dict[str, int]
    risk_distribution: Dict[str, int]
    education_distribution: Dict[str, int]
    employment_distribution: Dict[str, int]
    total_loan_volume: float
    total_asset_volume: float


class AdminMonitoringResponse(BaseModel):
    """Lightweight ML model telemetry and performance tracking."""
    model_version: str
    algorithm: str
    status: str
    total_predictions: int
    average_latency_ms: float
    risk_distribution: Dict[str, int]
    recommendation_distribution: Dict[str, int]
    training_metrics: Dict[str, Any]
    feature_importance: Dict[str, float]
    recent_predictions: List[Dict[str, Any]]
    all_models_test_metrics: Optional[Dict[str, Dict[str, Any]]] = None
    all_models_cv_metrics: Optional[Dict[str, Dict[str, Any]]] = None
    candidate_models: Optional[List[str]] = None
    champion_model: Optional[str] = None
    champion_version: Optional[str] = None
