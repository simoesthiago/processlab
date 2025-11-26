"""
Basic API Health Check Test

Minimal test to verify FastAPI application starts and responds.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test that /health endpoint returns successfully"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["service"] == "processlab-api"
    assert "version" in data


def test_root_endpoint():
    """Test that root endpoint returns API information"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ProcessLab API"
    assert "endpoints" in data
    assert "architecture_notes" in data


def test_openapi_docs():
    """Test that OpenAPI docs are available"""
    response = client.get("/docs")
    assert response.status_code == 200


# TODO (Sprint 2+):
# - Add tests for ingest endpoint
# - Add tests for generate endpoint
# - Add tests for edit endpoint
# - Add tests for export endpoint
# - Add database fixture tests
# - Add RAG system tests
# - Add multiagent orchestration tests
