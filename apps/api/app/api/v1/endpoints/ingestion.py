"""
Ingestion Endpoint

Thin HTTP layer that delegates to use case.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.config import settings
from app.infrastructure.services.storage.local import storage_service
from app.infrastructure.services.ingestion.pipeline import IngestionPipeline
from app.application.ingestion.upload_artifact import UploadArtifactUseCase, UploadArtifactCommand
import uuid

router = APIRouter()
pipeline = IngestionPipeline()


def background_ingest(object_name: str):
    """Background task to process uploaded documents."""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        import asyncio
        asyncio.run(pipeline.process_document(object_name, db))
    finally:
        db.close()


@router.post("/upload", status_code=202)
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload files for processing by ProcessWizard.
    
    Supports: PDF, PNG, JPG, DOCX, TXT
    """
    use_case = UploadArtifactUseCase(db)
    results = []
    
    for file in files:
        # Generate safe filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        object_name = f"{uuid.uuid4()}.{file_ext}"
        
        # Upload to Local Storage
        storage_service.upload_file(file.file, object_name)
        
        # Get file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset
        
        # Create artifact using use case
        command = UploadArtifactCommand(
            filename=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            storage_path=object_name
        )
        
        result = use_case.execute(command)
        
        # Trigger Background Task for processing
        background_tasks.add_task(background_ingest, object_name)
        
        results.append({
            "id": result.artifact_id,
            "filename": result.filename,
            "status": "processing"
        })
    
    return {"uploaded": results}


@router.get("/status/{artifact_id}")
def get_status(
    artifact_id: str,
    db: Session = Depends(get_db),
):
    """Get processing status of an uploaded artifact."""
    from app.db.models import Artifact
    
    artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return {
        "id": artifact.id,
        "status": artifact.status,
        "extracted_text": artifact.extracted_text[:500] if artifact.extracted_text else None,
        "error": artifact.processing_error
    }
