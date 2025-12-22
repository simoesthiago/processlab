"""
BPMN XML to JSON Converter

Parses BPMN 2.0 XML and converts it to the internal BPMN_JSON format.
"""

from typing import Dict, Any, List
import xml.etree.ElementTree as ET
from app.api import BPMNJSON, BPMNElement, SequenceFlow, ProcessInfo

def to_bpmn_json(xml_content: str) -> BPMNJSON:
    """
    Convert BPMN 2.0 XML to internal BPMN_JSON format.
    """
    try:
        root = ET.fromstring(xml_content)
    except Exception as e:
        # Fallback for string input
        root = ET.fromstring(xml_content)

    # Namespace map
    ns = {
        'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
        'bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
        'dc': 'http://www.omg.org/spec/DD/20100524/DC',
        'di': 'http://www.omg.org/spec/DD/20100524/DI'
    }
    
    def find_all(element, tag):
        return element.findall(f".//bpmn:{tag}", ns) + element.findall(f".//{tag}")

    process = root.find(".//bpmn:process", ns) or root.find(".//process")
    
    process_id = process.get("id") if process is not None else "Process_1"
    process_name = process.get("name") if process is not None else "Generated Process"
    
    elements: List[BPMNElement] = []
    flows: List[SequenceFlow] = []
    
    # Parse Nodes
    node_types = [
        "startEvent", "endEvent", 
        "task", "userTask", "serviceTask", 
        "exclusiveGateway", "parallelGateway"
    ]
    
    for tag in node_types:
        for elem in find_all(root, tag):
            node_id = elem.get("id")
            name = elem.get("name")
            # Determine type
            node_type = tag
            
            elements.append(BPMNElement(
                id=node_id,
                type=node_type,
                name=name
            ))
            
    # Parse Edges (Sequence Flows)
    for elem in find_all(root, "sequenceFlow"):
        edge_id = elem.get("id")
        source = elem.get("sourceRef")
        target = elem.get("targetRef")
        name = elem.get("name")
        
        flows.append(SequenceFlow(
            id=edge_id,
            type="sequenceFlow",
            source=source,
            target=target,
            name=name
        ))
        
    return BPMNJSON(
        process=ProcessInfo(id=process_id, name=process_name),
        elements=elements,
        flows=flows
    )
