"""
Edit API - Natural Language BPMN Editing

Thin HTTP layer that delegates to use case.
Maintains version history and provides human-readable change descriptions.
"""

from fastapi import APIRouter, HTTPException, status, Header, Depends
from sqlalchemy.orm import Session
from app.api.schemas.bpmn_operations import EditRequest, EditResponse
from app.api.schemas.common import BPMNJSON
from app.db.session import get_db
from app.db.models import AuditEntry, LOCAL_USER_ID
from app.domain.entities.process import Process
from app.core.dependencies import get_edit_bpmn_use_case, get_version_repository, get_process_repository
from app.application.bpmn.edit_bpmn import EditBpmnUseCase, EditBpmnCommand
from app.application.versioning.create_version import CreateVersionUseCase, CreateVersionCommand
from app.infrastructure.services.bpmn.patch import BpmnPatchService
from typing import Optional
import logging
import re
import json
import hashlib

router = APIRouter(tags=["edit"])
logger = logging.getLogger(__name__)

patch_service = BpmnPatchService()

class CommandInterpreter:
    """
    Simple regex-based interpreter for Sprint 4.
    In future sprints, this will be replaced/augmented by an LLM.
    """
    def interpret(self, command: str) -> dict:
        command = command.lower().strip()
        
        # 1. Add Task
        match = re.search(r"add (?:a )?(?:user )?task (?:called|named) ['\"]?([^'\"]+)['\"]?", command)
        if match:
            name = match.group(1)
            return {
                "op": "add_node",
                "args": {
                    "type": "bpmn:UserTask" if "user task" in command else "bpmn:Task",
                    "name": name,
                    "x": 200, "y": 200
                }
            }
            
        # 2. Add Start/End Event
        if "add" in command and "start event" in command:
             return {"op": "add_node", "args": {"type": "bpmn:StartEvent", "name": "Start", "x": 50, "y": 200}}
        if "add" in command and "end event" in command:
             return {"op": "add_node", "args": {"type": "bpmn:EndEvent", "name": "End", "x": 500, "y": 200}}
             
        # 3. Connect
        match = re.search(r"connect ['\"]?([^'\"]+)['\"]? to ['\"]?([^'\"]+)['\"]?", command)
        if match:
            source_name = match.group(1)
            target_name = match.group(2)
            return {
                "op": "connect_by_name",
                "args": {"sourceName": source_name, "targetName": target_name}
            }
            
        # 4. Remove
        match = re.search(r"remove ['\"]?([^'\"]+)['\"]?", command)
        if match:
            name = match.group(1)
            return {"op": "remove_by_name", "args": {"name": name}}

        # 5. Rename
        match = re.search(r"rename ['\"]?([^'\"]+)['\"]? to ['\"]?([^'\"]+)['\"]?", command)
        if match:
            old_name = match.group(1)
            new_name = match.group(2)
            return {"op": "rename_by_name", "args": {"oldName": old_name, "newName": new_name}}

        # 6. Convert
        match = re.search(r"convert ['\"]?([^'\"]+)['\"]? to (?:exclusive )?gateway", command)
        if match:
            name = match.group(1)
            return {"op": "convert_by_name", "args": {"name": name, "type": "bpmn:ExclusiveGateway"}}

        # Default fallback
        return {"op": "noop", "args": {}}

interpreter = CommandInterpreter()

def resolve_names_to_ids(bpmn: BPMNJSON, patch: dict) -> dict:
    """Helper to resolve name-based lookups to IDs for the patch service."""
    op = patch.get("op")
    args = patch.get("args", {})
    
    name_to_id = {n.name.lower(): n.id for n in bpmn.elements if n.name}
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

    return patch

def compute_etag(payload: dict) -> str:
    """Generate deterministic etag for optimistic locking."""
    serialized = json.dumps(payload or {}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


@router.post("/", response_model=EditResponse)
async def edit_bpmn(
    request: EditRequest,
    x_request_id: Optional[str] = Header(None, description="Request tracking ID"),
    x_openai_api_key: Optional[str] = Header(None, alias="X-OpenAI-API-Key", description="BYOK OpenAI key"),
    db: Session = Depends(get_db)
) -> EditResponse:
    """
    Edit BPMN using natural language commands.
    """
    edit_use_case = get_edit_bpmn_use_case(db)
    version_repo = get_version_repository(db)
    process_repo = get_process_repository(db)
    
    # Validate command
    if not request.command or not request.command.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Command cannot be empty"
        )
    
    # Resolve BPMN Input
    current_bpmn = request.bpmn
    
    if not current_bpmn:
        if request.bpmn_xml:
            # Convert XML to JSON
            try:
                from app.infrastructure.services.bpmn.xml_to_json import to_bpmn_json
                current_bpmn = to_bpmn_json(request.bpmn_xml)
            except Exception as e:
                logger.error(f"Failed to convert XML to JSON: {e}")
                raise HTTPException(status_code=400, detail=f"Invalid BPMN XML: {e}")
        elif request.model_version_id:
            # Load from DB
            version = version_repo.find_by_id(request.model_version_id)
            if version and version.bpmn_json:
                current_bpmn = BPMNJSON(**version.bpmn_json)
            else:
                raise HTTPException(status_code=404, detail="Model version not found or has no JSON")
        else:
            raise HTTPException(status_code=400, detail="Must provide bpmn, bpmn_xml, or model_version_id")

    # 1. Interpret Command (LLM when key provided, regex fallback otherwise)
    try:
        if x_openai_api_key:
            from app.infrastructure.services.ai.llm_interpreter import LlmCommandInterpreter, LlmInterpreterError
            try:
                llm = LlmCommandInterpreter(api_key=x_openai_api_key)
                elements = [
                    {"id": el.id, "name": el.name, "type": el.type}
                    for el in current_bpmn.elements
                ] if current_bpmn.elements else []
                raw_patch = llm.interpret(request.command, elements)
                logger.info(f"LLM interpreted command as: {raw_patch['op']}")
            except LlmInterpreterError as llm_err:
                raise HTTPException(status_code=llm_err.status_code, detail=str(llm_err))
        else:
            raw_patch = interpreter.interpret(request.command)
        if raw_patch["op"] == "noop":
             logger.warning(f"Could not interpret command: {request.command}")
             return EditResponse(
                bpmn=current_bpmn,
                version_id=request.model_version_id or "unchanged",
                changes=["Command not understood"]
            )
            
        # 2. Resolve Names to IDs
        patch = resolve_names_to_ids(current_bpmn, raw_patch)
        
        # 3. Use edit use case to apply patch and lint
        current_bpmn_dict = current_bpmn.model_dump()
        
        # Compute etag for optimistic locking
        etag = None
        if request.if_match:
            etag = request.if_match
        
        edit_command = EditBpmnCommand(
            current_bpmn_json=current_bpmn_dict,
            patch=patch,
            if_match=etag
        )
        
        # Execute use case (applies patch and lints)
        edit_result = edit_use_case.execute(edit_command)
        updated_bpmn_dict = edit_result.updated_bpmn_json

    except Exception as e:
        logger.error(f"Error applying patch: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    # 5. Save Version
    process_id = None
    previous_version_number = 0
    
    if request.model_version_id:
        prev_version = version_repo.find_by_id(request.model_version_id)
        if prev_version:
            process_id = prev_version.process_id
            previous_version_number = prev_version.version_number
    
    if not process_id:
        # Create a dummy process for this session if none exists
        process = Process.create(name="Edited Process")
        saved_process = process_repo.save(process)
        process_id = saved_process.id
    
    # Create version using use case
    create_version_use_case = CreateVersionUseCase(version_repo, process_repo)
    version_command = CreateVersionCommand(
        process_id=process_id,
        bpmn_json=updated_bpmn_dict,
        generation_method="manual_edit",
        commit_message=request.command,
        change_type="minor",
        parent_version_id=request.model_version_id
    )
    
    new_version = create_version_use_case.execute(version_command)
    new_version_id = new_version.id
        
    # 6. Create Audit Entry
    audit = AuditEntry(
        event_type="bpmn.edited",
        resource_type="model_version",
        resource_id=new_version_id,
        changes={"command": request.command, "patch": patch},
        meta={"lint_errors": edit_result.lint_errors} if edit_result.lint_errors else {}
    )
    db.add(audit)
    db.commit()
    
    changes_list = [f"Applied: {patch['op']}"]
    if edit_result.lint_errors:
        changes_list.extend([f"Warning: {err}" for err in edit_result.lint_errors])
    
    return EditResponse(
        bpmn=BPMNJSON(**updated_bpmn_dict),
        version_id=new_version_id,
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
