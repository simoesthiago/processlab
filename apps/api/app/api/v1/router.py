from fastapi import APIRouter
from app.api.v1.endpoints import auth, ingestion, organizations, projects, processes, users, shares
from app.api.v1 import generate, edit, export, search

api_router = APIRouter()

# Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Organization and Project Management
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(processes.router, tags=["processes"])  # Has its own nested paths
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(shares.router, prefix="/shares", tags=["shares"])

# BPMN Operations
api_router.include_router(ingestion.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(generate.router, prefix="/generate", tags=["generate"])
api_router.include_router(edit.router, prefix="/edit", tags=["edit"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(search.router, prefix="/search", tags=["search"])

