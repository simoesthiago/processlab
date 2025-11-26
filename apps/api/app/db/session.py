"""
Database Session and Engine Configuration

Provides database session management and engine initialization.
Supports connection pooling and proper session lifecycle.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@db:5432/processlab"
)

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Max overflow connections
    echo=False,  # Set to True for SQL query logging in development
)

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
    
    This should only be used in development.
    In production, use Alembic migrations.
    """
    from app.db.models import Base
    Base.metadata.create_all(bind=engine)


# TODO (Sprint 2+):
# - Add async database support (asyncpg + SQLAlchemy 2.0)
# - Implement read replicas for scaling
# - Add database health check function
