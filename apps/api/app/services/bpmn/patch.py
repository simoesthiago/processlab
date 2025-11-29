"""
BPMN Patch Service

Applies deterministic patches to BPMN models.
"""

from typing import Dict, Any, Optional
import uuid
from app.schemas import BPMNJSON, BPMNElement, SequenceFlow

class BpmnPatchService:
    def apply_patch(self, bpmn: BPMNJSON, patch: Dict[str, Any]) -> BPMNJSON:
        """
        Apply a single patch operation to the BPMN model.
        Returns the modified BPMN model (in-place modification is also done, but returned for convenience).
        """
        op = patch.get("op")
        args = patch.get("args", {})
        
        if op == "add_node":
            self._add_node(bpmn, args)
        elif op == "connect":
            self._connect(bpmn, args)
        elif op == "remove":
            self._remove(bpmn, args)
        elif op == "rename":
            self._rename(bpmn, args)
        elif op == "convert":
            self._convert(bpmn, args)
        elif op == "move_to_lane":
            self._move_to_lane(bpmn, args)
        elif op == "set_property":
            self._set_property(bpmn, args)
        else:
            raise ValueError(f"Unknown operation: {op}")
            
        return bpmn

    def _add_node(self, bpmn: BPMNJSON, args: Dict[str, Any]):
        node_type = args.get("type", "task").replace("bpmn:", "") # Normalize
        node_id = args.get("id") or f"{node_type}_{uuid.uuid4().hex[:8]}"
        
        # Map type to allowed literal
        # Simple mapping for now
        if "Task" in node_type and node_type not in ["userTask", "serviceTask", "scriptTask", "businessRuleTask"]:
            node_type = "task"
            
        node = BPMNElement(
            id=node_id,
            type=node_type,
            name=args.get("name", ""),
            laneId=args.get("laneId")
        )
        bpmn.elements.append(node)

    def _connect(self, bpmn: BPMNJSON, args: Dict[str, Any]):
        source_id = args.get("sourceId")
        target_id = args.get("targetId")
        
        if not source_id or not target_id:
            raise ValueError("Connect requires sourceId and targetId")
            
        edge_id = f"Flow_{uuid.uuid4().hex[:8]}"
        edge = SequenceFlow(
            id=edge_id,
            type="sequenceFlow",
            source=source_id,
            target=target_id,
            name=args.get("name", "")
        )
        bpmn.flows.append(edge)

    def _remove(self, bpmn: BPMNJSON, args: Dict[str, Any]):
        target_id = args.get("id")
        if not target_id:
            raise ValueError("Remove requires id")
            
        # Remove node
        bpmn.elements = [n for n in bpmn.elements if n.id != target_id]
        
        # Remove edges connected to node
        bpmn.flows = [e for e in bpmn.flows if e.source != target_id and e.target != target_id]
        
        # Remove edge if target_id refers to an edge
        bpmn.flows = [e for e in bpmn.flows if e.id != target_id]

    def _rename(self, bpmn: BPMNJSON, args: Dict[str, Any]):
        target_id = args.get("id")
        new_name = args.get("name")
        
        if not target_id or new_name is None:
            raise ValueError("Rename requires id and name")
            
        for node in bpmn.elements:
            if node.id == target_id:
                node.name = new_name
                return
                
        for edge in bpmn.flows:
            if edge.id == target_id:
                edge.name = new_name
                return

    def _convert(self, bpmn: BPMNJSON, args: Dict[str, Any]):
        target_id = args.get("id")
        new_type = args.get("type").replace("bpmn:", "")
        
        if not target_id or not new_type:
            raise ValueError("Convert requires id and type")
            
        for node in bpmn.elements:
            if node.id == target_id:
                # Pydantic models are immutable by default? No, usually mutable.
                # But type is Literal, so we might need to be careful.
                # Actually, we can just assign if it matches literal.
                node.type = new_type
                return

    def _move_to_lane(self, bpmn: BPMNJSON, args: Dict[str, Any]):
        target_id = args.get("id")
        lane_id = args.get("laneId")
        
        if not target_id or not lane_id:
            raise ValueError("Move to lane requires id and laneId")
            
        for node in bpmn.elements:
            if node.id == target_id:
                node.laneId = lane_id
                return

    def _set_property(self, bpmn: BPMNJSON, args: Dict[str, Any]):
        # BPMNElement doesn't have generic properties dict in schema yet.
        # It has 'meta'.
        # We'll ignore for now or add to meta if applicable.
        pass
