from fastapi import APIRouter
from app.api.v1.endpoints import auth, ingestion, processes, users, folders, spaces
from app.api.v1 import generate, edit, export, search

api_router = APIRouter()

# Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Resource Management
api_router.include_router(processes.router, tags=["processes"])
api_router.include_router(folders.router, tags=["folders"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(spaces.router, tags=["spaces"])


# BPMN Operations
api_router.include_router(ingestion.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(generate.router, prefix="/generate", tags=["generate"])
api_router.include_router(edit.router, prefix="/edit", tags=["edit"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(search.router, prefix="/search", tags=["search"])

