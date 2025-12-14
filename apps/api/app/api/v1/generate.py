"""
Generate endpoint for BPMN creation from artifacts
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ProcessModel, ModelVersion, Project, User, Folder
from app.core.dependencies import get_current_user, require_organization_access
from app.services.agents.pipeline import generate_process
from app.services.bpmn.json_to_xml import to_bpmn_xml as bpmn_json_to_xml
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class GenerateRequest(BaseModel):
    """Request schema for BPMN generation"""
    artifact_ids: List[str] = Field(..., description="List of artifact IDs to use as context")
    process_name: str = Field(default="Untitled Process", description="Name for the generated process")
    project_id: Optional[str] = Field(None, description="Project ID to associate the process with")
    folder_id: Optional[str] = Field(None, description="Folder inside the project (optional)")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Generation options")


class GenerateResponse(BaseModel):
    """Response schema for BPMN generation"""
    bpmn_json: Dict[str, Any] = Field(..., description="Generated BPMN in JSON format")
    preview_xml: str = Field(..., description="Generated BPMN in XML format (for preview)")
    process_id: Optional[str] = Field(None, description="Created process ID (if project_id was provided)")
    model_version_id: str = Field(..., description="Model version ID")
    metrics: Dict[str, Any] = Field(..., description="Generation metrics")


@router.post("/", response_model=GenerateResponse)
async def generate_bpmn(
    request: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a BPMN diagram from artifacts using AI.
    
    If project_id is provided, creates a ProcessModel and ModelVersion in the database.
    Otherwise, just returns the generated BPMN without persisting.
    """
    logger.info(f"Generate request: artifacts={request.artifact_ids}, process_name={request.process_name}, project_id={request.project_id}")
    
    # TODO: Fetch actual artifacts from DB and extract context
    # For now, using a placeholder context
    context = {
        "artifacts": request.artifact_ids,
        "process_name": request.process_name
    }
    
    # Generate BPMN using AI pipeline
    result = await generate_process(
        context=context,
        process_name=request.process_name,
        options=request.options
    )
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    bpmn_json_data = result["json"]
    preview_xml = result["xml"]
    
    # If project_id is provided, persist to database
    process_id = None
    if request.project_id:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.deleted_at == None
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check user has access
        if project.organization_id:
            # Organization project - require org access
            require_organization_access(current_user, project.organization_id)
        else:
            # Personal project - must be the owner (unless superuser)
            if not current_user.is_superuser and project.owner_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied to this personal project")

        # Validate optional folder
        target_folder_id = None
        if request.folder_id:
            folder = db.query(Folder).filter(
                Folder.id == request.folder_id,
                Folder.deleted_at == None  # noqa: E711
            ).first()
            if not folder:
                raise HTTPException(status_code=404, detail="Folder not found")
            if folder.project_id != project.id:
                raise HTTPException(status_code=400, detail="Folder must belong to the same project")
            target_folder_id = folder.id
        
        # Create ProcessModel
        process = ProcessModel(
            project_id=request.project_id,
            folder_id=target_folder_id,
            organization_id=project.organization_id,
            name=request.process_name,
            description=f"Generated from artifacts: {', '.join(request.artifact_ids)}",
            created_by=current_user.id
        )
        db.add(process)
        db.flush()  # Get process ID
        
        # Create ModelVersion
        version = ModelVersion(
            process_id=process.id,
            version_number=1,
            version_label="v1",
            bpmn_json=bpmn_json_data,
            generation_method="ai_generated",
            source_artifact_ids=request.artifact_ids,
            generation_prompt=f"Generate {request.process_name}",
            status="ready",
            created_by=current_user.id
        )
        db.add(version)
        db.flush()
        
        # Set as current version
        process.current_version_id = version.id
        
        db.commit()
        db.refresh(process)
        db.refresh(version)
        
        process_id = process.id
        model_version_id = version.id
        
        logger.info(f"Created process {process_id} with version {model_version_id}")
    else:
        # Generate a temporary version ID if not persisting
        import uuid
        model_version_id = str(uuid.uuid4())
    
    return GenerateResponse(
        bpmn_json=bpmn_json_data,
        preview_xml=preview_xml,
        process_id=process_id,
        model_version_id=model_version_id,
        metrics=result.get("metrics", {})
    )
