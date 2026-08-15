"""CrediWiseAI - Database Engine and Session Management.

Initializes SQLAlchemy engine for SQLite, declarative Base, and database session dependency.
"""

from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.app.core.config import settings

# Configure SQLite engine with check_same_thread=False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    """FastAPI dependency that provides a database session and ensures closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Creates database tables automatically if they do not already exist and seeds demo accounts."""
    # Import models here to ensure they are registered with Base.metadata
    from backend.app.models.models import User
    from backend.app.core.security import get_password_hash

    Base.metadata.create_all(bind=engine)

    # Seed or ensure default demo accounts exist
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@credwise.ai").first()
        if not admin:
            admin = User(
                name="Admin Reviewer",
                email="admin@credwise.ai",
                password_hash=get_password_hash("AdminPassword@123"),
                role="admin",
                is_active=True,
            )
            db.add(admin)
        else:
            admin.role = "admin"
            admin.password_hash = get_password_hash("AdminPassword@123")

        applicant = db.query(User).filter(User.email == "applicant@credwise.ai").first()
        if not applicant:
            applicant = User(
                name="Demo Applicant",
                email="applicant@credwise.ai",
                password_hash=get_password_hash("Password@123"),
                role="user",
                is_active=True,
            )
            db.add(applicant)
        else:
            applicant.password_hash = get_password_hash("Password@123")

        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

