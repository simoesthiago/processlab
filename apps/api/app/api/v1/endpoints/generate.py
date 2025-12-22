"""
Generate endpoint for BPMN creation from artifacts

Thin HTTP layer that delegates to use case.
"""

from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_generate_bpmn_use_case
from app.application.bpmn.generate_bpmn import GenerateBpmnUseCase, GenerateBpmnCommand
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
    use_case: GenerateBpmnUseCase = Depends(get_generate_bpmn_use_case)
):
    """
    Generate a BPMN diagram from artifacts using AI.
    
    Creates a ProcessModel and ModelVersion in the database.
    """
    logger.info(f"Generate request: artifacts={request.artifact_ids}, process_name={request.process_name}")
    
    try:
        # Create command
        command = GenerateBpmnCommand(
            artifact_ids=request.artifact_ids,
            process_name=request.process_name,
            folder_id=request.folder_id,
            options=request.options
        )
        
        # Execute use case
        result = await use_case.execute(command)
        
        # Build response
        return GenerateResponse(
            bpmn_json=result.bpmn_json,
            preview_xml=result.preview_xml,
            process_id=result.process.id if result.process else None,
            model_version_id=result.version.id if result.version else "",
            metrics=result.metrics
        )
    except Exception as e:
        logger.error(f"Error generating BPMN: {e}")
        raise HTTPException(status_code=500, detail=str(e))
