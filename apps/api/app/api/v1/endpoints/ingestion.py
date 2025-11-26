from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.db.models import Artifact, User
from app.core.config import settings
from app.workers.tasks import ingest_artifact_task
from minio import Minio
import uuid

router = APIRouter()

minio_client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE
)

# Ensure bucket exists
if not minio_client.bucket_exists(bucket_name=settings.MINIO_BUCKET):
    minio_client.make_bucket(bucket_name=settings.MINIO_BUCKET)

@router.post("/upload", status_code=202)
async def upload_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    results = []
    for file in files:
        # Generate safe filename
        file_ext = file.filename.split(".")[-1]
        object_name = f"{uuid.uuid4()}.{file_ext}"
        
        # Upload to MinIO
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=object_name,
            data=file.file,
            length=-1,
            part_size=10*1024*1024
        )
        
        # Create Artifact record
        artifact = Artifact(
            filename=file.filename,
            mime_type=file.content_type,
            file_size=0, # TODO: Get size
            storage_path=object_name,
            storage_bucket=settings.MINIO_BUCKET,
            uploaded_by=current_user.id,
            status="uploaded"
        )
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        
        # Trigger Async Task
        ingest_artifact_task.delay(artifact.id)
        
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
