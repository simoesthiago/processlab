"""
ProcessLab API

FastAPI backend for BPMN process modeling with AI assistance.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ProcessLab API",
    description="AI-powered BPMN process modeling platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# Allow Next.js frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security: Add trusted host middleware
# TODO: Configure for production domains
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "testserver", "*.processlab.io"]  # testserver for FastAPI TestClient
)

# Include API routers
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")



@app.get("/health")
def health():
    """Health check endpoint"""
    return {
        "ok": True,
        "service": "processlab-api",
        "version": "0.1.0"
    }


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
    logger.info("ProcessLab API starting up...")
    # TODO: Initialize database connections
    # TODO: Initialize object storage client
    # TODO: Initialize RAG system
    # TODO: Load LLM configurations


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    logger.info("ProcessLab API shutting down...")
    # TODO: Close database connections
    # TODO: Close storage connections
