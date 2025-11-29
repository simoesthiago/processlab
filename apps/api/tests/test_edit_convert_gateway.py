import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_edit_convert_gateway():
    # Initial BPMN with a task
    bpmn = {
        "process": {"id": "proc1", "name": "Test Process"},
        "elements": [
            {"id": "task1", "type": "task", "name": "Decision"}
        ],
        "flows": []
    }
    
    # Convert to Gateway
    response = client.post("/api/v1/edit/", json={
        "bpmn": bpmn,
        "command": "Convert 'Decision' to gateway"
    })
    assert response.status_code == 200
    data = response.json()
    
    # Check if node type changed
    nodes = data["bpmn"]["elements"]
    task_node = [n for n in nodes if n["name"] == "Decision"][0]
    assert task_node["type"] == "exclusiveGateway"
