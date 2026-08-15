"""CrediWiseAI - SQLAlchemy Database Models.

Defines tables for Users, Loan Applications, Predictions, Explanations, and Audit Logs
strictly based on the Kaggle INR-native ML contract and canonical status values.
"""

from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.db.session import Base


def utc_now():
    """Returns current UTC datetime."""
    return datetime.now(timezone.utc)


class User(Base):
    """User account model supporting User and Admin roles."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "user" | "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    applications = relationship(
        "LoanApplication",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(LoanApplication.created_at), desc(LoanApplication.id)",
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        order_by="desc(AuditLog.created_at), desc(AuditLog.id)",
    )


class LoanApplication(Base):
    """Loan application model storing the 11 supported Kaggle INR features."""

    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    applicant_name = Column(String(100), nullable=False)

    # 11 Kaggle INR-Native Source Features
    no_of_dependents = Column(Integer, nullable=False)
    education = Column(String(50), nullable=False)  # "Graduate" | "Not Graduate"
    self_employed = Column(String(10), nullable=False)  # "Yes" | "No"
    income_annum = Column(Float, nullable=False)  # INR Annual Income
    loan_amount = Column(Float, nullable=False)  # INR Requested Loan
    loan_term = Column(Integer, nullable=False)  # Tenure in Years
    cibil_score = Column(Integer, nullable=False)  # 300 to 900
    residential_assets_value = Column(Float, nullable=False)  # INR
    commercial_assets_value = Column(Float, nullable=False)  # INR
    luxury_assets_value = Column(Float, nullable=False)  # INR
    bank_asset_value = Column(Float, nullable=False)  # INR

    # Canonical status: UNDER_REVIEW, APPROVED, REJECTED, INFO_REQUESTED
    status = Column(String(30), default="UNDER_REVIEW", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="applications")
    predictions = relationship(
        "PredictionResult",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="desc(PredictionResult.created_at), desc(PredictionResult.id)",
    )


class PredictionResult(Base):
    """Model for persisting ML predictions, derived indicators, and risk metrics."""

    __tablename__ = "prediction_results"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("loan_applications.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    model_version = Column(String(50), nullable=False)
    recommendation = Column(String(30), nullable=False)  # "APPROVED" | "REJECTED"
    approval_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # "LOW" | "MEDIUM" | "HIGH"
    inference_latency_ms = Column(Float, nullable=False)

    # Derived Financial Indicators (INR)
    monthly_income = Column(Float, nullable=False)
    loan_to_annual_income_ratio = Column(Float, nullable=False)
    loan_to_monthly_income_ratio = Column(Float, nullable=False)
    total_asset_value = Column(Float, nullable=False)
    asset_to_loan_ratio = Column(Float, nullable=False)
    bank_asset_to_annual_income_ratio = Column(Float, nullable=False)
    estimated_principal_monthly_payment = Column(Float, nullable=False)
    estimated_payment_to_income_ratio = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    application = relationship("LoanApplication", back_populates="predictions")
    explanations = relationship(
        "PredictionExplanation",
        back_populates="prediction",
        cascade="all, delete-orphan",
        order_by="PredictionExplanation.rank",
    )


class PredictionExplanation(Base):
    """Model for transparent factor attributions and decision explanations."""

    __tablename__ = "prediction_explanations"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(
        Integer,
        ForeignKey("prediction_results.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    feature_name = Column(String(100), nullable=False)
    display_name = Column(String(150), nullable=False)
    impact = Column(String(30), nullable=False)  # "POSITIVE" | "NEGATIVE" | "NEUTRAL"
    direction = Column(String(50), nullable=False)  # "INCREASES_APPROVAL" | "DECREASES_APPROVAL"
    rank = Column(Integer, nullable=False)
    explanation_text = Column(Text, nullable=False)

    # Relationships
    prediction = relationship("PredictionResult", back_populates="explanations")


class AuditLog(Base):
    """Audit log model for tracking security and business events without secrets."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
