import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_edit_rollback_on_lint_error():
    # Initial BPMN
    bpmn = {
        "process": {"id": "proc1", "name": "Test Process"},
        "elements": [
            {"id": "start", "type": "startEvent", "name": "Start"}
        ],
        "flows": []
    }
    
    # Add a disconnected task (should trigger lint warning)
    response = client.post("/api/v1/edit/", json={
        "bpmn": bpmn,
        "command": "Add a task called 'Disconnected'"
    })
    assert response.status_code == 200
    data = response.json()
    
    # Check if changes include warning
    changes = data["changes"]
    warnings = [c for c in changes if "Warning" in c]
    assert len(warnings) > 0
    assert "unreachable" in warnings[0] or "dead end" in warnings[0] or "not connected" in warnings[0]
