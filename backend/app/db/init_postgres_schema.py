"""CrediWiseAI - PostgreSQL Schema Initialization Utility.

Creates PostgreSQL database schema using SQLAlchemy Base metadata.
Ensures tables, columns, primary keys, foreign keys, unique constraints,
and indexes match the canonical SQLAlchemy model definitions without
copying data, modifying SQLite, or altering application logic.
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from typing import Dict, List, Optional

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

# Ensure all SQLAlchemy models are registered on Base.metadata
from backend.app.db.session import Base
from backend.app.models.models import (
    AuditLog,
    LoanApplication,
    PredictionExplanation,
    PredictionResult,
    User,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("crediwise.db.init_postgres_schema")

EXPECTED_TABLES = [
    "users",
    "loan_applications",
    "prediction_results",
    "prediction_explanations",
    "audit_logs",
]


def create_postgres_engine(database_url: Optional[str] = None) -> Engine:
    """Creates a SQLAlchemy engine for PostgreSQL.
    
    If database_url is not provided, reads from POSTGRES_DATABASE_URL or DATABASE_URL environment variables.
    Ensures standard postgresql+psycopg scheme is used when appropriate.
    """
    url = database_url or os.environ.get("POSTGRES_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError(
            "No PostgreSQL database URL provided. Set POSTGRES_DATABASE_URL environment variable or pass --db-url."
        )
    
    # Normalize postgres:// or postgresql:// to postgresql+psycopg:// if needed for psycopg 3
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    return create_engine(url, pool_pre_ping=True)


def init_postgres_schema(engine: Engine) -> None:
    """Creates all database tables in dependency order on the target database engine."""
    logger.info("Initializing schema on target database...")
    Base.metadata.create_all(bind=engine)
    logger.info("Schema creation completed successfully.")


def verify_postgres_schema(engine: Engine) -> Dict[str, any]:
    """Verifies that all expected tables, foreign keys, and empty row counts exist on target PostgreSQL database."""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names(schema="public")
    
    report = {
        "tables": {},
        "row_counts": {},
        "foreign_keys": {},
        "all_tables_present": True,
        "all_tables_empty": True,
    }
    
    for table_name in EXPECTED_TABLES:
        if table_name not in existing_tables:
            report["all_tables_present"] = False
            report["tables"][table_name] = {"status": "MISSING"}
            continue
        
        columns = inspector.get_columns(table_name, schema="public")
        fks = inspector.get_foreign_keys(table_name, schema="public")
        indexes = inspector.get_indexes(table_name, schema="public")
        unique_constraints = inspector.get_unique_constraints(table_name, schema="public")
        pk_constraint = inspector.get_pk_constraint(table_name, schema="public")
        
        report["tables"][table_name] = {
            "status": "PRESENT",
            "columns": [c["name"] for c in columns],
            "column_count": len(columns),
            "primary_key": pk_constraint.get("constrained_columns", []),
            "foreign_keys": fks,
            "indexes": [idx["name"] for idx in indexes],
            "unique_constraints": unique_constraints,
        }
        report["foreign_keys"][table_name] = fks
        
        with engine.connect() as conn:
            result = conn.execute(text(f'SELECT count(*) FROM public."{table_name}"'))
            row_count = result.scalar()
            report["row_counts"][table_name] = row_count
            if row_count != 0:
                report["all_tables_empty"] = False

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize PostgreSQL schema for CrediWise.")
    parser.add_argument(
        "--db-url",
        type=str,
        default=None,
        help="Target PostgreSQL database URL (e.g. postgresql+psycopg://user:password@localhost:5432/crediwise)",
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Only verify existing schema without applying DDL",
    )
    args = parser.parse_args()

    try:
        engine = create_postgres_engine(args.db_url)
        if not args.verify_only:
            init_postgres_schema(engine)
        
        report = verify_postgres_schema(engine)
        logger.info("Verification Report:")
        for table, details in report["tables"].items():
            count = report["row_counts"].get(table, "N/A")
            logger.info(f"  Table: {table:25} | Status: {details['status']:7} | Columns: {details.get('column_count', 0):2} | Rows: {count}")
        
        if report["all_tables_present"] and report["all_tables_empty"]:
            logger.info("SUCCESS: All tables created and empty on target PostgreSQL database.")
        else:
            logger.warning("Target PostgreSQL schema verification encountered discrepancies.")
    except Exception as e:
        logger.error(f"Error during schema initialization: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
