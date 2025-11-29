import sys
import os

# Add apps/api to path
sys.path.append(os.path.join(os.getcwd(), "apps/api"))

from app.services.bpmn.json_to_xml import to_bpmn_xml

dummy_json = {
    "process": {"id": "Process_1", "name": "Test"},
    "lanes": [
        {"id": "Lane_1", "name": "Main Lane", "childElementIds": ["StartEvent_1", "Task_1"]}
    ],
    "elements": [
        {"id": "StartEvent_1", "type": "startEvent", "name": "Start", "laneId": "Lane_1"},
        {"id": "Task_1", "type": "task", "name": "Task", "laneId": "Lane_1"}
    ],
    "flows": [
        {"id": "Flow_1", "source": "StartEvent_1", "target": "Task_1"}
    ]
}

print(to_bpmn_xml(dummy_json))
