from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ProcessModel, ModelVersion, ModelVersionArtifact
from app.services.agents.pipeline import generate_process
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid

router = APIRouter()

class GenerateRequest(BaseModel):
    artifact_ids: List[str]
    process_name: str
    options: Optional[Dict[str, Any]] = {}

class GenerateResponse(BaseModel):
    model_version_id: str
    status: str
    metrics: Optional[Dict[str, Any]] = None
    preview_xml: Optional[str] = None

@router.post("/", response_model=GenerateResponse)
async def generate_bpmn(
    request: GenerateRequest, 
    db: Session = Depends(get_db)
):
    """
    Generate a BPMN process from artifacts.
    """
    # 1. Validate artifacts (simple check if they exist could be added here)
    if not request.artifact_ids:
        raise HTTPException(status_code=400, detail="No artifacts provided")

    # 2. Call Orchestrator
    # Note: For long running tasks, this should be a background task or Celery worker.
    # For Sprint 3 (P95 < 60s), we run async directly but be mindful of timeouts.
    result = await generate_process(request.artifact_ids, request.options)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))

    # 3. Persist to DB
    # Create Process
    process = ProcessModel(
        name=request.process_name,
        created_by="system"  # TODO: Get from auth
    )
    db.add(process)
    db.flush()  # Get ID
    
    # Create Version
    version = ModelVersion(
        process_id=process.id,
        version_number=1,
        version_label="v1 (AI Generated)",
        bpmn_json=result["json"],
        generation_method="ai_generated",
        source_artifact_ids=request.artifact_ids,
        status="ready"
    )
    db.add(version)
    db.flush()
    
    # Link artifacts
    for artifact_id in request.artifact_ids:
        link = ModelVersionArtifact(
            model_version_id=version.id,
            artifact_id=artifact_id
        )
        db.add(link)
    
    db.commit()
    db.refresh(version)
    
    # 4. Return response
    return GenerateResponse(
        model_version_id=version.id,
        status="ready",
        metrics={
            "nodes": len(result["json"]["elements"]),
            "edges": len(result["json"]["flows"]),
            "duration": result["metrics"]["duration"]
        },
        preview_xml=result["xml"][:5000] if len(result["xml"]) > 5000 else result["xml"]  # Truncate if too large
    ) 
