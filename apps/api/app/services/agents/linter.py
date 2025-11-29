"""
BPMN Linter Service

Validates BPMN models against core rules:
- Must have at least one start event
- Must have at least one end event
- No disconnected nodes (all nodes must be reachable from start or lead to end)
- Exclusive Gateways must have at least 2 outgoing paths
- Complex Gateways are not allowed
"""

from typing import List, Dict, Any, Set
from app.schemas import BPMNJSON

class BpmnLinter:
    def lint(self, bpmn: BPMNJSON) -> List[str]:
        """
        Lint a BPMN model and return a list of error messages.
        Returns empty list if valid.
        """
        errors = []
        
        nodes = bpmn.elements
        edges = bpmn.flows
        
        # 1. Start/End Events
        start_events = [n for n in nodes if n.type == 'startEvent' or n.type == 'bpmn:StartEvent']
        end_events = [n for n in nodes if n.type == 'endEvent' or n.type == 'bpmn:EndEvent']
        
        if not start_events:
            errors.append("Process must have at least one Start Event")
        if not end_events:
            errors.append("Process must have at least one End Event")
            
        # 2. Complex Gateway Check
        complex_gateways = [n for n in nodes if n.type == 'complexGateway' or n.type == 'bpmn:ComplexGateway']
        if complex_gateways:
            errors.append("Complex Gateways are not supported")
            
        # 3. Exclusive Gateway Paths
        exclusive_gateways = [n for n in nodes if n.type == 'exclusiveGateway' or n.type == 'bpmn:ExclusiveGateway']
        for gateway in exclusive_gateways:
            outgoing = [e for e in edges if e.source == gateway.id]
            if len(outgoing) < 2:
                errors.append(f"Exclusive Gateway '{gateway.name or gateway.id}' must have at least 2 outgoing paths")
                
        # 4. Connectivity (Basic Reachability)
        node_ids = {n.id for n in nodes}
        incoming_map: Dict[str, int] = {nid: 0 for nid in node_ids}
        outgoing_map: Dict[str, int] = {nid: 0 for nid in node_ids}
        
        for edge in edges:
            if edge.target in incoming_map:
                incoming_map[edge.target] += 1
            if edge.source in outgoing_map:
                outgoing_map[edge.source] += 1
                
        for node in nodes:
            # Normalize type check
            t = node.type.replace('bpmn:', '')
            if t == 'startEvent':
                if outgoing_map[node.id] == 0:
                    errors.append(f"Start Event '{node.name or node.id}' is not connected to anything")
            elif t == 'endEvent':
                if incoming_map[node.id] == 0:
                    errors.append(f"End Event '{node.name or node.id}' is unreachable")
            else:
                # Regular nodes
                if incoming_map[node.id] == 0:
                    errors.append(f"Node '{node.name or node.id}' is unreachable (no incoming flows)")
                if outgoing_map[node.id] == 0:
                    errors.append(f"Node '{node.name or node.id}' is a dead end (no outgoing flows)")

        return errors

def lint_bpmn_json(bpmn_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Module-level helper to lint a raw dictionary.
    Raises ValueError if critical errors are found.
    Returns the original dict if valid.
    """
    try:
        model = BPMNJSON(**bpmn_dict)
    except Exception as e:
        raise ValueError(f"Invalid BPMN JSON structure: {e}")
        
    linter = BpmnLinter()
    errors = linter.lint(model)
    
    if errors:
        # For now, we treat all lint errors as critical for generation
        raise ValueError(f"Generated BPMN failed validation: {'; '.join(errors)}")
        
    return bpmn_dict
