from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.db.models import Artifact, User
from app.core.config import settings
from app.services.storage.local import storage_service
from app.services.ingestion.pipeline import IngestionPipeline
import uuid

router = APIRouter()
pipeline = IngestionPipeline()

def background_ingest(object_name: str):
    # Create a new session for the background task
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
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    results = []
    for file in files:
        # Generate safe filename
        file_ext = file.filename.split(".")[-1]
        object_name = f"{uuid.uuid4()}.{file_ext}"
        
        # Upload to Local Storage
        storage_service.upload_file(file.file, object_name)
        
        # Create Artifact record
        artifact = Artifact(
            filename=file.filename,
            mime_type=file.content_type,
            file_size=0, 
            storage_path=object_name,
            storage_bucket="artifacts",
            uploaded_by=current_user.id,
            status="uploaded"
        )
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        
        # Trigger Background Task
        # Note: In a real app we'd want robust queueing, but for local demo BackgroundTasks is fine
        background_tasks.add_task(background_ingest, object_name)
        
        results.append({"id": artifact.id, "filename": artifact.filename, "status": "processing"})
    
    return {"uploaded": results}

@router.get("/status/{artifact_id}")
def get_status(
    artifact_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    if artifact.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return {
        "id": artifact.id,
        "status": artifact.status,
        "chunk_count": artifact.chunk_count,
        "error": artifact.processing_error
    }
