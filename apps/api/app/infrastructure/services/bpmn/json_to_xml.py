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
    # Use explicit bpmn prefix for compatibility
    ET.register_namespace('bpmn', BPMN_NS)
    ET.register_namespace('bpmndi', BPMNDI_NS)
    ET.register_namespace('dc', OMGDC_NS)
    ET.register_namespace('di', OMGDI_NS)
    
    definitions = ET.Element(f"{{{BPMN_NS}}}definitions", {
        "id": f"Definitions_{uuid.uuid4().hex[:8]}",
        "targetNamespace": TARGET_NS,
        "exporter": "BPMappr",
        "exporterVersion": "1.0"
    })
    
    # Create Collaboration (required for Pools/Lanes)
    collaboration_id = f"Collaboration_{uuid.uuid4().hex[:8]}"
    collaboration = ET.SubElement(definitions, f"{{{BPMN_NS}}}collaboration", {
        "id": collaboration_id
    })

    # Process element
    process_data = bpmn_json.get("process", {})
    process_id = process_data.get("id", f"Process_{uuid.uuid4().hex[:8]}")
    process_name = process_data.get("name", "Process")
    
    # Create Participant (Pool) linked to Process
    participant_id = f"Participant_{uuid.uuid4().hex[:8]}"
    ET.SubElement(collaboration, f"{{{BPMN_NS}}}participant", {
        "id": participant_id,
        "name": "Agente Principal", # Could be parameterized
        "processRef": process_id
    })
    
    process = ET.SubElement(definitions, f"{{{BPMN_NS}}}process", {
        "id": process_id,
        "name": process_name,
        "isExecutable": "false"
    })
    
    # Map elements
    elements = bpmn_json.get("elements", [])
    flows = bpmn_json.get("flows", [])
    lanes = bpmn_json.get("lanes", [])
    
    # Create LaneSet if lanes exist
    if lanes:
        lane_set = ET.SubElement(process, f"{{{BPMN_NS}}}laneSet", {
            "id": f"LaneSet_{uuid.uuid4().hex[:8]}"
        })
        for lane_data in lanes:
            lane = ET.SubElement(lane_set, f"{{{BPMN_NS}}}lane", {
                "id": lane_data["id"],
                "name": lane_data.get("name", "Lane")
            })
            # Add flowNodeRefs
            for child_id in lane_data.get("childElementIds", []):
                ref = ET.SubElement(lane, f"{{{BPMN_NS}}}flowNodeRef")
                ref.text = child_id
    
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
        
    # Generate Diagram (BPMNDiagram)
    diagram = ET.SubElement(definitions, f"{{{BPMNDI_NS}}}BPMNDiagram", {
        "id": f"BPMNDiagram_{process_id}"
    })
    plane = ET.SubElement(diagram, f"{{{BPMNDI_NS}}}BPMNPlane", {
        "id": f"BPMNPlane_{process_id}",
        "bpmnElement": collaboration_id # Plane now references Collaboration, not Process
    })

    # Generate DI Shape for Participant (Pool)
    pool_shape = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNShape", {
        "id": f"BPMNShape_{participant_id}",
        "bpmnElement": participant_id,
        "isHorizontal": "true"
    })
    ET.SubElement(pool_shape, f"{{{OMGDC_NS}}}Bounds", {
        "x": "0", "y": "0", "width": "600", "height": "250" # Default size
    })

    # Generate DI Shapes for Lanes
    for lane_data in lanes:
        lane_shape = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNShape", {
            "id": f"BPMNShape_{lane_data['id']}",
            "bpmnElement": lane_data['id'],
        })
        ET.SubElement(lane_shape, f"{{{OMGDC_NS}}}Bounds", {
            "x": "30", "y": "0", "width": "570", "height": "250" # Default size
        })

    # Generate DI Shapes for all elements
    for el in elements:
        shape = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNShape", {
            "id": f"BPMNShape_{el['id']}",
            "bpmnElement": el['id']
        })
        # Determine size based on type
        # Default Task size
        width = "140"
        height = "90"
        el_type = el.get("type", "").lower()
        
        if "event" in el_type:
            width = "30"
            height = "30"
        elif "gateway" in el_type:
            width = "40"
            height = "40"
        elif "datastore" in el_type or "data store" in el_type:
            width = "50"
            height = "50"
        elif "dataobject" in el_type or "data object" in el_type:
            width = "40"
            height = "50"

        # Default Bounds (x=0, y=0) - ELK or Auto Layout will fix this
        ET.SubElement(shape, f"{{{OMGDC_NS}}}Bounds", {
            "x": "0", "y": "0", "width": width, "height": height
        })

    # Generate DI Edges for all flows
    for flow in flows:
        edge = ET.SubElement(plane, f"{{{BPMNDI_NS}}}BPMNEdge", {
            "id": f"BPMNEdge_{flow['id']}",
            "bpmnElement": flow['id']
        })
        # Default Waypoints (0,0 -> 0,0) - ELK or Auto Layout will fix this
        ET.SubElement(edge, f"{{{OMGDI_NS}}}waypoint", {"x": "0", "y": "0"})
        ET.SubElement(edge, f"{{{OMGDI_NS}}}waypoint", {"x": "0", "y": "0"})
    
    # Return raw XML string with declaration
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(definitions, encoding='unicode')
