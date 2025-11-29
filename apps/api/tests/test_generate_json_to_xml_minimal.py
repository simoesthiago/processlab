"""
Test JSON to XML Converter
"""
import pytest
from app.services.bpmn.json_to_xml import to_bpmn_xml
import xml.etree.ElementTree as ET

def test_json_to_xml_minimal():
    bpmn_json = {
        "process": {"id": "Process_1", "name": "Test Process"},
        "elements": [
            {"id": "StartEvent_1", "type": "startEvent", "name": "Start"},
            {"id": "Task_1", "type": "task", "name": "Do Work"},
            {"id": "EndEvent_1", "type": "endEvent", "name": "End"}
        ],
        "flows": [
            {"id": "Flow_1", "source": "StartEvent_1", "target": "Task_1"},
            {"id": "Flow_2", "source": "Task_1", "target": "EndEvent_1"}
        ]
    }
    
    xml_str = to_bpmn_xml(bpmn_json)
    
    # Basic validation
    assert "definitions" in xml_str
    assert "process" in xml_str
    assert "startEvent" in xml_str
    assert "task" in xml_str
    assert "endEvent" in xml_str
    assert "sequenceFlow" in xml_str
    
    # Parse to ensure valid XML
    root = ET.fromstring(xml_str)
    ns = {'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL'}
    
    process = root.find('bpmn:process', ns)
    assert process is not None
    assert len(process.findall('bpmn:task', ns)) == 1
