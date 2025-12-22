"""
API Router Configuration

All v1 API routes for ProcessLab.
Note: No authentication routes - this is a local-first, single-user app.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    ingestion, processes, folders, spaces,
    generate, edit, export, search
)

api_router = APIRouter()

# Resource Management
api_router.include_router(processes.router, tags=["processes"])
api_router.include_router(folders.router, tags=["folders"])
api_router.include_router(spaces.router, tags=["spaces"])

# BPMN Operations
api_router.include_router(ingestion.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(generate.router, prefix="/generate", tags=["generate"])
api_router.include_router(edit.router, prefix="/edit", tags=["edit"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
