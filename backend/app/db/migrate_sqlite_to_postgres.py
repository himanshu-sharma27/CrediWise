"""CrediWiseAI - SQLite to PostgreSQL Data Migration Utility.

Safely copies data from local SQLite database (crediwise.db) to PostgreSQL (crediwise).
- Preserves explicit primary keys (id), foreign keys, hashes, and timestamps.
- Enforces strict dependency order: users -> loan_applications -> prediction_results -> prediction_explanations, users -> audit_logs.
- Operates in a safe transaction (atomic rollback on error).
- Updates PostgreSQL sequences post-migration to prevent ID collisions.
- Verifies post-migration counts, ID ranges, and foreign key integrity.
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.core.config import PROJECT_ROOT, settings
from backend.app.db.session import Base
from backend.app.models.models import (
    AuditLog,
    LoanApplication,
    PredictionExplanation,
    PredictionResult,
    User,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("crediwise.db.migration")

TABLE_MODEL_ORDER = [
    ("users", User),
    ("loan_applications", LoanApplication),
    ("prediction_results", PredictionResult),
    ("prediction_explanations", PredictionExplanation),
    ("audit_logs", AuditLog),
]


def get_source_engine(source_url: Optional[str] = None) -> Engine:
    """Returns SQLAlchemy engine for the source SQLite database."""
    url = source_url or settings.DATABASE_URL
    if not url.startswith("sqlite"):
        # Fallback to local crediwise.db in project root
        sqlite_path = PROJECT_ROOT / "crediwise.db"
        url = f"sqlite:///{sqlite_path}"
    
    return create_engine(url, connect_args={"check_same_thread": False})


def get_target_engine(target_url: Optional[str] = None) -> Engine:
    """Returns SQLAlchemy engine for the target PostgreSQL database."""
    url = target_url or os.environ.get("POSTGRES_MIGRATION_URL") or os.environ.get("POSTGRES_DATABASE_URL")
    if not url:
        raise ValueError(
            "PostgreSQL migration credentials are not available through the environment. "
            "Set POSTGRES_MIGRATION_URL environment variable."
        )
    
    # Normalize postgresql:// to postgresql+psycopg:// if needed for psycopg 3
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    return create_engine(url, pool_pre_ping=True)


def verify_target_empty(pg_engine: Engine) -> Dict[str, int]:
    """Verifies that all target PostgreSQL tables exist and are empty."""
    inspector = inspect(pg_engine)
    existing_tables = inspector.get_table_names(schema="public")
    
    counts = {}
    with pg_engine.connect() as conn:
        for table_name, _ in TABLE_MODEL_ORDER:
            if table_name not in existing_tables:
                raise RuntimeError(
                    f"Target PostgreSQL table '{table_name}' does not exist. Run schema initialization first."
                )
            result = conn.execute(text(f'SELECT count(*) FROM public."{table_name}"'))
            row_count = result.scalar()
            counts[table_name] = row_count
            if row_count > 0:
                raise RuntimeError(
                    f"Target PostgreSQL table '{table_name}' already contains {row_count} records. "
                    "Migration aborted to prevent data corruption."
                )
    return counts


def migrate_data(source_engine: Engine, target_engine: Engine) -> Dict[str, int]:
    """Migrates all records from SQLite to PostgreSQL within a single transaction."""
    SourceSession = sessionmaker(bind=source_engine, autocommit=False, autoflush=False)
    TargetSession = sessionmaker(bind=target_engine, autocommit=False, autoflush=False)

    src_db = SourceSession()
    tgt_db = TargetSession()

    migrated_counts: Dict[str, int] = {}

    try:
        logger.info("Beginning data migration from SQLite to PostgreSQL...")

        for table_name, model_class in TABLE_MODEL_ORDER:
            logger.info(f"Reading records from SQLite table '{table_name}'...")
            records = src_db.query(model_class).order_by(model_class.id.asc()).all()
            count = len(records)
            logger.info(f"Found {count} records in '{table_name}'. Inserting into PostgreSQL...")

            for rec in records:
                # Extract all column data without relationships
                col_data = {
                    col.name: getattr(rec, col.name)
                    for col in model_class.__table__.columns
                }
                new_rec = model_class(**col_data)
                tgt_db.add(new_rec)

            # Flush to enforce constraints and catch any immediate integrity issues
            tgt_db.flush()
            migrated_counts[table_name] = count
            logger.info(f"Successfully staged {count} records for '{table_name}'.")

        # Update PostgreSQL auto-increment sequences so future inserts don't collide
        logger.info("Updating PostgreSQL primary key sequences...")
        for table_name, _ in TABLE_MODEL_ORDER:
            seq_sql = text(f"""
                SELECT setval(
                    pg_get_serial_sequence('public."{table_name}"', 'id'),
                    COALESCE((SELECT MAX(id) FROM public."{table_name}"), 1)
                );
            """)
            tgt_db.execute(seq_sql)

        tgt_db.commit()
        logger.info("Data migration committed successfully.")
        return migrated_counts

    except Exception as e:
        logger.error(f"Migration error occurred: {e}. Rolling back PostgreSQL transaction...")
        tgt_db.rollback()
        raise
    finally:
        src_db.close()
        tgt_db.close()


def verify_migration_integrity(source_engine: Engine, target_engine: Engine) -> Dict[str, any]:
    """Comprehensively verifies row counts, ID bounds, foreign keys, and user integrity."""
    SourceSession = sessionmaker(bind=source_engine, autocommit=False, autoflush=False)
    TargetSession = sessionmaker(bind=target_engine, autocommit=False, autoflush=False)

    src_db = SourceSession()
    tgt_db = TargetSession()

    report = {
        "counts_match": True,
        "ids_preserved": True,
        "foreign_keys_valid": True,
        "user_hashes_preserved": True,
        "details": {},
    }

    try:
        # 1. Row counts & Primary Key Min/Max validation
        for table_name, model_class in TABLE_MODEL_ORDER:
            src_records = src_db.query(model_class).order_by(model_class.id.asc()).all()
            tgt_records = tgt_db.query(model_class).order_by(model_class.id.asc()).all()

            src_count = len(src_records)
            tgt_count = len(tgt_records)

            src_ids = [r.id for r in src_records]
            tgt_ids = [r.id for r in tgt_records]

            counts_equal = src_count == tgt_count
            ids_equal = src_ids == tgt_ids

            if not counts_equal:
                report["counts_match"] = False
            if not ids_equal:
                report["ids_preserved"] = False

            report["details"][table_name] = {
                "sqlite_count": src_count,
                "postgres_count": tgt_count,
                "counts_match": counts_equal,
                "ids_match": ids_equal,
                "min_id": tgt_ids[0] if tgt_ids else None,
                "max_id": tgt_ids[-1] if tgt_ids else None,
            }

        # 2. Foreign Key validation (orphans check)
        with target_engine.connect() as conn:
            # loan_applications.user_id -> users.id
            orphan_apps = conn.execute(text("""
                SELECT count(*) FROM public.loan_applications la 
                LEFT JOIN public.users u ON la.user_id = u.id 
                WHERE u.id IS NULL;
            """)).scalar()

            # prediction_results.application_id -> loan_applications.id
            orphan_preds = conn.execute(text("""
                SELECT count(*) FROM public.prediction_results pr 
                LEFT JOIN public.loan_applications la ON pr.application_id = la.id 
                WHERE pr.application_id IS NOT NULL AND la.id IS NULL;
            """)).scalar()

            # prediction_explanations.prediction_id -> prediction_results.id
            orphan_expls = conn.execute(text("""
                SELECT count(*) FROM public.prediction_explanations pe 
                LEFT JOIN public.prediction_results pr ON pe.prediction_id = pr.id 
                WHERE pr.id IS NULL;
            """)).scalar()

            # audit_logs.user_id -> users.id
            orphan_audits = conn.execute(text("""
                SELECT count(*) FROM public.audit_logs al 
                LEFT JOIN public.users u ON al.user_id = u.id 
                WHERE al.user_id IS NOT NULL AND u.id IS NULL;
            """)).scalar()

            if any([orphan_apps > 0, orphan_preds > 0, orphan_expls > 0, orphan_audits > 0]):
                report["foreign_keys_valid"] = False

            report["foreign_key_orphans"] = {
                "loan_applications_user_id": orphan_apps,
                "prediction_results_application_id": orphan_preds,
                "prediction_explanations_prediction_id": orphan_expls,
                "audit_logs_user_id": orphan_audits,
            }

        # 3. User integrity check (hashes, emails, roles) without printing hashes
        src_users = src_db.query(User).order_by(User.id.asc()).all()
        tgt_users = tgt_db.query(User).order_by(User.id.asc()).all()
        
        for su, tu in zip(src_users, tgt_users):
            if su.id != tu.id or su.email != tu.email or su.password_hash != tu.password_hash or su.role != tu.role:
                report["user_hashes_preserved"] = False
                break

    finally:
        src_db.close()
        tgt_db.close()

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate CrediWise SQLite data to PostgreSQL.")
    parser.add_argument(
        "--source-url",
        type=str,
        default=None,
        help="Source SQLite URL (defaults to crediwise.db)",
    )
    parser.add_argument(
        "--target-url",
        type=str,
        default=None,
        help="Target PostgreSQL URL (e.g. postgresql+psycopg://user:password@localhost:5432/crediwise)",
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Only verify data integrity between SQLite and PostgreSQL without migrating",
    )
    args = parser.parse_args()

    try:
        source_engine = get_source_engine(args.source_url)
        target_engine = get_target_engine(args.target_url)

        if not args.verify_only:
            verify_target_empty(target_engine)
            migrate_data(source_engine, target_engine)

        report = verify_migration_integrity(source_engine, target_engine)
        logger.info("=== Migration Verification Report ===")
        for tbl, det in report["details"].items():
            logger.info(
                f"  Table: {tbl:25} | SQLite: {det['sqlite_count']:3} | PostgreSQL: {det['postgres_count']:3} | IDs Match: {det['ids_match']}"
            )
        logger.info(f"  Foreign Key Integrity (0 orphans): {report['foreign_keys_valid']}")
        logger.info(f"  User Data & Password Hashes Preserved: {report['user_hashes_preserved']}")

    except Exception as e:
        logger.error(f"Migration aborted: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
