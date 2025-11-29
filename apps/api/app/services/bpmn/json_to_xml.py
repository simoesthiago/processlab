"""
BPMN JSON to XML Converter
Converts internal BPMN_JSON format to standard BPMN 2.0 XML.
"""
import uuid
from typing import Dict, Any, List
import xml.etree.ElementTree as ET
from xml.dom import minidom

BPMN_NS = "http://www.omg.org/spec/BPMN/20100524/MODEL"
BPMNDI_NS = "http://www.omg.org/spec/BPMN/20100524/DI"
OMGDC_NS = "http://www.omg.org/spec/DD/20100524/DC"
OMGDI_NS = "http://www.omg.org/spec/DD/20100524/DI"
TARGET_NS = "http://bpmappr.local/bpmn"

def to_bpmn_xml(bpmn_json: Dict[str, Any]) -> str:
    """
    Convert BPMN_JSON to BPMN 2.0 XML string.
    
    Args:
        bpmn_json: Dictionary containing 'process', 'elements', and 'flows'.
        
    Returns:
        String containing the BPMN 2.0 XML.
    """
    # Create root definitions element
    ET.register_namespace('', BPMN_NS)
    ET.register_namespace('bpmndi', BPMNDI_NS)
    ET.register_namespace('omgdc', OMGDC_NS)
    ET.register_namespace('omgdi', OMGDI_NS)
    
    definitions = ET.Element(f"{{{BPMN_NS}}}definitions", {
        "id": f"Definitions_{uuid.uuid4().hex[:8]}",
        "targetNamespace": TARGET_NS,
        "exporter": "BPMappr",
        "exporterVersion": "1.0"
    })
    
    # Process element
    process_data = bpmn_json.get("process", {})
    process_id = process_data.get("id", f"Process_{uuid.uuid4().hex[:8]}")
    process_name = process_data.get("name", "Process")
    
    process = ET.SubElement(definitions, f"{{{BPMN_NS}}}process", {
        "id": process_id,
        "name": process_name,
        "isExecutable": "false"
    })
    
    # Map elements
    elements = bpmn_json.get("elements", [])
    flows = bpmn_json.get("flows", [])
    
    # Helper to find incoming/outgoing flows for a node
    node_flows = {el["id"]: {"incoming": [], "outgoing": []} for el in elements}
    for flow in flows:
        source = flow.get("source")
        target = flow.get("target")
        if source in node_flows:
            node_flows[source]["outgoing"].append(flow["id"])
        if target in node_flows:
            node_flows[target]["incoming"].append(flow["id"])
            
    # Create nodes
    for el in elements:
        el_type = el.get("type", "task")
        el_id = el.get("id")
        el_name = el.get("name", "")
        
        # Map internal types to BPMN XML tags
        tag_name = el_type  # default assumption: type matches tag (e.g. startEvent, task)
        
        node = ET.SubElement(process, f"{{{BPMN_NS}}}{tag_name}", {
            "id": el_id,
            "name": el_name
        })
        
        # Add incoming/outgoing refs
        if el_id in node_flows:
            for flow_id in node_flows[el_id]["incoming"]:
                incoming = ET.SubElement(node, f"{{{BPMN_NS}}}incoming")
                incoming.text = flow_id
            for flow_id in node_flows[el_id]["outgoing"]:
                outgoing = ET.SubElement(node, f"{{{BPMN_NS}}}outgoing")
                outgoing.text = flow_id
                
    # Create sequence flows
    for flow in flows:
        flow_id = flow.get("id", f"Flow_{uuid.uuid4().hex[:8]}")
        # Ensure flow has ID in the JSON if not present, for consistency
        flow["id"] = flow_id
        
        ET.SubElement(process, f"{{{BPMN_NS}}}sequenceFlow", {
            "id": flow_id,
            "sourceRef": flow.get("source"),
            "targetRef": flow.get("target")
        })
        
    # Generate Diagram (BPMNDiagram) - Minimal stub for validity
    # Real layout would go here or be applied by ELK
    diagram = ET.SubElement(definitions, f"{{{BPMNDI_NS}}}BPMNDiagram", {
        "id": f"BPMNDiagram_{process_id}"
    })
    plane = ET.SubElement(diagram, f"{{{BPMNDI_NS}}}BPMNPlane", {
        "id": f"BPMNPlane_{process_id}",
        "bpmnElement": process_id
    })
    
    # Pretty print
    xml_str = minidom.parseString(ET.tostring(definitions)).toprettyxml(indent="  ")
    return xml_str
