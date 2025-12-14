"""
ProcessLab API

FastAPI backend for BPMN process modeling with AI assistance.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
import os
from app.core.config import settings

# Setup structured logging FIRST
from app.core.logging_config import setup_logging

# Determine if we should use JSON logs (production) or text logs (development)
USE_JSON_LOGS = os.getenv("JSON_LOGS", "true").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

setup_logging(log_level=LOG_LEVEL, json_logs=USE_JSON_LOGS)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ProcessLab API",
    description="AI-powered BPMN process modeling platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup custom middlewares (request tracking, logging, error handling)
from app.core.middleware import setup_middlewares
setup_middlewares(app)

# Setup exception handlers
from app.core.exceptions import setup_exception_handlers
setup_exception_handlers(app)

# CORS Configuration
# Allow Next.js frontend to make requests (dev defaults + env override)
default_cors_origins = settings.BACKEND_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in default_cors_origins],
    allow_origin_regex=r"https?://.*\.processlab\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security: Add trusted host middleware
# Note: This is added AFTER custom middlewares to run first in the chain
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "testserver", "*.processlab.io"]
)

# Include API routers
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")




@app.get("/health")
async def health():
    """
    Comprehensive health check endpoint.
    Verifies connectivity to critical services: Database and MinIO.
    """
    from sqlalchemy import text
    from app.db.session import get_db
    import os
    
    health_status = {
        "ok": True,
        "service": "processlab-api",
        "version": "0.1.0",
        "checks": {}
    }
    
    # Database health
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        health_status["ok"] = False
        health_status["checks"]["database"] = {"status": "unhealthy", "message": str(e)}
        logger.error(f"Database health check failed: {e}")
    
    # Storage health (Local)
    from app.services.storage.local import storage_service
    if storage_service.base_path.exists():
        health_status["checks"]["storage"] = {"status": "healthy", "message": "Local storage ready"}
    else:
         health_status["checks"]["storage"] = {"status": "unhealthy", "message": "Storage path missing"}

    return health_status


# Convenience: health under API prefix for tooling that expects /api/v1/health

@app.get("/api/v1/health")
async def health_v1():
    return await health()



@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "service": "ProcessLab API",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": {
            "ingest": "/api/v1/ingest",
            "generate": "/api/v1/generate",
            "edit": "/api/v1/edit",
            "export": "/api/v1/export",
            "search": "/api/v1/search"
        },
        "architecture_notes": {
            "internal_format": "BPMN_JSON (see /docs for schema)",
            "xml_conversion": "Only at export/visualization time (cite PRD: 166)",
            "layout_engine": "ELK.js for pools/lanes (cite PRD: 149)",
            "security": "BYOK pattern - user API keys never logged (cite Architecture: 523)"
        }
    }


@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("ProcessLab API starting up (Locally)...")
    # TODO: Initialize database connections
    # Storage initialized on module load
    # TODO: Initialize RAG system
    # TODO: Load LLM configurations


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    logger.info("ProcessLab API shutting down...")
    # TODO: Close database connections
    # TODO: Close storage connections
