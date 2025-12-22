"""
Database Session and Engine Configuration

SQLite-based session management for local-first usage.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from pathlib import Path

from app.core.config import settings


def get_database_url() -> str:
    """Build SQLite connection URL from settings."""
    sqlite_path = Path(settings.SQLITE_PATH).resolve()
    # Ensure parent directory exists
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{sqlite_path}"


# Create SQLite engine
# Note: check_same_thread=False is needed for FastAPI async usage
engine = create_engine(
    get_database_url(),
    connect_args={"check_same_thread": False},
    echo=False,  # Set to True for SQL query logging in development
)


# Enable foreign keys for SQLite (disabled by default)
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    
    Creates all tables from the models.
    In production, you can also use Alembic migrations.
    """
    from app.db.models import Base
    Base.metadata.create_all(bind=engine)
