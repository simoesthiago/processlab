"""
Edit API - Natural Language BPMN Editing

Copilot-style editing using natural language commands.
Maintains version history and provides human-readable change descriptions.
"""

from fastapi import APIRouter, HTTPException, status, Header, Depends
from sqlalchemy.orm import Session
from app.schemas import EditRequest, EditResponse, BPMNJSON
from app.db.session import get_db
from app.db.models import ModelVersion, AuditEntry, ProcessModel
from app.services.bpmn.patch import BpmnPatchService
from app.services.agents.linter import BpmnLinter
from typing import Optional, List, Dict, Any
import uuid
import logging
import re
import json

router = APIRouter(tags=["edit"])
logger = logging.getLogger(__name__)

patch_service = BpmnPatchService()
linter = BpmnLinter()

class CommandInterpreter:
    """
    Simple regex-based interpreter for Sprint 4.
    In future sprints, this will be replaced/augmented by an LLM.
    """
    def interpret(self, command: str) -> Dict[str, Any]:
        command = command.lower().strip()
        
        # 1. Add Task
        # "add a task called 'review'"
        match = re.search(r"add (?:a )?(?:user )?task (?:called|named) ['\"]?([^'\"]+)['\"]?", command)
        if match:
            name = match.group(1)
            return {
                "op": "add_node",
                "args": {
                    "type": "bpmn:UserTask" if "user task" in command else "bpmn:Task",
                    "name": name,
                    "x": 200, "y": 200 # Default position, layout will fix
                }
            }
            
        # 2. Add Start/End Event
        if "add" in command and "start event" in command:
             return {"op": "add_node", "args": {"type": "bpmn:StartEvent", "name": "Start", "x": 50, "y": 200}}
        if "add" in command and "end event" in command:
             return {"op": "add_node", "args": {"type": "bpmn:EndEvent", "name": "End", "x": 500, "y": 200}}
             
        # 3. Connect
        # "connect 'task a' to 'task b'"
        match = re.search(r"connect ['\"]?([^'\"]+)['\"]? to ['\"]?([^'\"]+)['\"]?", command)
        if match:
            source_name = match.group(1)
            target_name = match.group(2)
            # Note: In a real implementation we need to resolve names to IDs.
            # For this stub, we'll assume the frontend sends IDs or we do a lookup.
            # Since we only have the BPMN in the request, we can look it up.
            return {
                "op": "connect_by_name", # Special internal op
                "args": {"sourceName": source_name, "targetName": target_name}
            }
            
        # 4. Remove
        # "remove 'task a'"
        match = re.search(r"remove ['\"]?([^'\"]+)['\"]?", command)
        if match:
            name = match.group(1)
            return {"op": "remove_by_name", "args": {"name": name}}

        # 5. Rename
        # "rename 'task a' to 'task b'"
        match = re.search(r"rename ['\"]?([^'\"]+)['\"]? to ['\"]?([^'\"]+)['\"]?", command)
        if match:
            old_name = match.group(1)
            new_name = match.group(2)
            return {"op": "rename_by_name", "args": {"oldName": old_name, "newName": new_name}}

        # 6. Convert
        # "convert 'task a' to gateway"
        match = re.search(r"convert ['\"]?([^'\"]+)['\"]? to (?:exclusive )?gateway", command)
        if match:
            name = match.group(1)
            # We need to find ID by name, then convert.
            # Convert op needs ID and Type.
            return {"op": "convert_by_name", "args": {"name": name, "type": "bpmn:ExclusiveGateway"}}

        # 7. Move to Lane
        # "move 'task a' to lane 'finance'"
        match = re.search(r"move ['\"]?([^'\"]+)['\"]? to lane ['\"]?([^'\"]+)['\"]?", command)
        if match:
            node_name = match.group(1)
            lane_name = match.group(2)
            return {"op": "move_to_lane_by_name", "args": {"nodeName": node_name, "laneName": lane_name}}

        # 8. Set Property
        # "set property 'risk' to 'high' on 'task a'"
        match = re.search(r"set property ['\"]?([^'\"]+)['\"]? to ['\"]?([^'\"]+)['\"]? on ['\"]?([^'\"]+)['\"]?", command)
        if match:
            key = match.group(1)
            value = match.group(2)
            node_name = match.group(3)
            return {"op": "set_property_by_name", "args": {"name": node_name, "key": key, "value": value}}

        # 9. Add Parallel Gateway
        if "add" in command and "parallel gateway" in command:
             return {"op": "add_node", "args": {"type": "bpmn:ParallelGateway", "name": "Parallel", "x": 300, "y": 200}}
             
        # 10. Add Exclusive Gateway
        if "add" in command and "exclusive gateway" in command:
             return {"op": "add_node", "args": {"type": "bpmn:ExclusiveGateway", "name": "Decision", "x": 300, "y": 200}}

        # Default fallback for testing
        return {"op": "noop", "args": {}}

interpreter = CommandInterpreter()

def resolve_names_to_ids(bpmn: BPMNJSON, patch: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper to resolve name-based lookups to IDs for the patch service.
    """
    op = patch.get("op")
    args = patch.get("args", {})
    
    name_to_id = {n.name.lower(): n.id for n in bpmn.elements if n.name}
    # Also map IDs to themselves in case user provided ID
    for n in bpmn.elements:
        name_to_id[n.id.lower()] = n.id
        
    if op == "connect_by_name":
        source = args.get("sourceName", "").lower()
        target = args.get("targetName", "").lower()
        s_id = name_to_id.get(source)
        t_id = name_to_id.get(target)
        
        if s_id and t_id:
            return {"op": "connect", "args": {"sourceId": s_id, "targetId": t_id}}
        else:
            raise HTTPException(status_code=400, detail=f"Could not find nodes for connection: {source} -> {target}")

    if op == "remove_by_name":
        name = args.get("name", "").lower()
        t_id = name_to_id.get(name)
        if t_id:
            return {"op": "remove", "args": {"id": t_id}}
        else:
             raise HTTPException(status_code=400, detail=f"Could not find node to remove: {name}")

    if op == "rename_by_name":
        old_name = args.get("oldName", "").lower()
        new_name = args.get("newName")
        t_id = name_to_id.get(old_name)
        if t_id:
            return {"op": "rename", "args": {"id": t_id, "name": new_name}}
        else:
             raise HTTPException(status_code=400, detail=f"Could not find node to rename: {old_name}")

    if op == "convert_by_name":
        name = args.get("name", "").lower()
        new_type = args.get("type")
        t_id = name_to_id.get(name)
        if t_id:
            return {"op": "convert", "args": {"id": t_id, "type": new_type}}
        else:
             raise HTTPException(status_code=400, detail=f"Could not find node to convert: {name}")

    if op == "set_property_by_name":
        name = args.get("name", "").lower()
        key = args.get("key")
        value = args.get("value")
        t_id = name_to_id.get(name)
        if t_id:
            return {"op": "set_property", "args": {"id": t_id, "key": key, "value": value}}
        else:
             raise HTTPException(status_code=400, detail=f"Could not find node to set property: {name}")

    return patch

@router.post("/", response_model=EditResponse)
async def edit_bpmn(
    request: EditRequest,
    x_request_id: Optional[str] = Header(None, description="Request tracking ID"),
    db: Session = Depends(get_db)
) -> EditResponse:
    """
    Edit BPMN using natural language commands.
    """
    
    # Validate command
    if not request.command or not request.command.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Command cannot be empty"
        )
    
    # SECURITY: Ensure API key is not logged
    if request.userApiKey:
        logger.info(f"Request {x_request_id}: Using user-provided API key (BYOK)")
    
    # Resolve BPMN Input
    current_bpmn = request.bpmn
    
    if not current_bpmn:
        if request.bpmn_xml:
            # Convert XML to JSON
            try:
                from app.services.bpmn.xml_to_json import to_bpmn_json
                current_bpmn = to_bpmn_json(request.bpmn_xml)
            except Exception as e:
                logger.error(f"Failed to convert XML to JSON: {e}")
                raise HTTPException(status_code=400, detail=f"Invalid BPMN XML: {e}")
        elif request.model_version_id:
            # Load from DB
            version = db.query(ModelVersion).filter(ModelVersion.id == request.model_version_id).first()
            if version and version.bpmn_json:
                # Convert dict to Pydantic model
                current_bpmn = BPMNJSON(**version.bpmn_json)
            else:
                raise HTTPException(status_code=404, detail="Model version not found or has no JSON")
        else:
            raise HTTPException(status_code=400, detail="Must provide bpmn, bpmn_xml, or model_version_id")

    # 1. Interpret Command
    try:
        raw_patch = interpreter.interpret(request.command)
        if raw_patch["op"] == "noop":
             logger.warning(f"Could not interpret command: {request.command}")
             return EditResponse(
                bpmn=current_bpmn,
                versionId=request.model_version_id or "unchanged",
                changes=["Command not understood"]
            )
            
        # 2. Resolve Names to IDs
        patch = resolve_names_to_ids(current_bpmn, raw_patch)
        
        # 3. Apply Patch
        updated_bpmn = patch_service.apply_patch(current_bpmn, patch)
        
        # 4. Lint
        lint_errors = linter.lint(updated_bpmn)

    except Exception as e:
        logger.error(f"Error applying patch: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    # 5. Save Version
    process_id = None
    previous_version_number = 0
    
    if request.model_version_id:
        prev_version = db.query(ModelVersion).filter(ModelVersion.id == request.model_version_id).first()
        if prev_version:
            process_id = prev_version.process_id
            previous_version_number = prev_version.version_number
    
    if not process_id:
        # Create a dummy process for this session if none exists
        new_process = ProcessModel(name="Edited Process", created_by="copilot")
        db.add(new_process)
        db.flush()
        process_id = new_process.id
        
    new_version = ModelVersion(
        process_id=process_id,
        version_number=previous_version_number + 1,
        version_label=f"v{previous_version_number + 1}",
        bpmn_json=updated_bpmn.model_dump(),
        generation_method="edited",
        status="draft",
        generation_prompt=request.command
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    new_version_id = new_version.id
        
    # 6. Create Audit Entry
    audit = AuditEntry(
        event_type="bpmn.edited",
        resource_type="model_version",
        resource_id=new_version_id,
        changes={"command": request.command, "patch": patch},
        meta={"lint_errors": lint_errors} if 'lint_errors' in locals() and lint_errors else {}
    )
    db.add(audit)
    db.commit()
    
    changes_list = [f"Applied: {patch['op']}"]
    if 'lint_errors' in locals() and lint_errors:
        changes_list.extend([f"Warning: {err}" for err in lint_errors])
    
    return EditResponse(
        bpmn=updated_bpmn,
        versionId=new_version_id,
        changes=changes_list
    )

@router.post("/suggest")
async def suggest_edits(request: EditRequest):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Edit suggestions not yet implemented"
    )

@router.post("/undo")
async def undo_edit(version_id: str):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Undo functionality not yet implemented"
    )
