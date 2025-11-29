import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import BPMNJSON

client = TestClient(app)

def test_edit_add_connect():
    # Initial empty BPMN
    bpmn = {
        "process": {"id": "proc1", "name": "Test Process"},
        "elements": [
            {"id": "start", "type": "startEvent", "name": "Start"}
        ],
        "flows": []
    }
    
    # 1. Add Task
    response = client.post("/api/v1/edit/", json={
        "bpmn": bpmn,
        "command": "Add a task called 'Review'"
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["bpmn"]["elements"]) == 2
    new_node = [n for n in data["bpmn"]["elements"] if n["name"] == "Review"][0]
    assert new_node["type"] == "task"
    
    # Update BPMN for next step
    bpmn = data["bpmn"]
    
    # 2. Connect
    response = client.post("/api/v1/edit/", json={
        "bpmn": bpmn,
        "command": f"Connect 'Start' to 'Review'"
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["bpmn"]["flows"]) == 1
    edge = data["bpmn"]["flows"][0]
    assert edge["source"] == "start"
    assert edge["target"] == new_node["id"]
