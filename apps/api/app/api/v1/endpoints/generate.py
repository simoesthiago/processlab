"""
Generate endpoint for BPMN creation from artifacts

Thin HTTP layer that delegates to use case.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_generate_bpmn_use_case
from app.application.bpmn.generate_bpmn import GenerateBpmnUseCase, GenerateBpmnCommand
from app.api.schemas.bpmn_operations import GenerateRequest, GenerateResponse
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=GenerateResponse)
async def generate_bpmn(
    request: GenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a BPMN diagram from artifacts using AI.
    
    Creates a ProcessModel and ModelVersion in the database.
    """
    use_case = get_generate_bpmn_use_case(db)
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
