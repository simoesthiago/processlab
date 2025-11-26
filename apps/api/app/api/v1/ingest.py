"""
Ingest API - Multimodal File Upload

Handles upload of various document formats (PDF, DOCX, images, text).
Maximum file size: 30MB per upload.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, status, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.schemas import IngestResponse
from app.db.session import get_db
from app.db.models import Artifact
from app.services.storage.minio import storage_service
from app.worker.main import process_artifact
import uuid

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])

# Supported MIME types
SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # DOCX
    "application/msword",  # DOC
    "image/png",
    "image/jpeg",
    "image/jpg",
    "text/plain",
}

MAX_FILE_SIZE = 30 * 1024 * 1024  # 30MB in bytes


@router.post("/", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def upload_artifact(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Document to upload (max 30MB)"),
    db: Session = Depends(get_db)
) -> IngestResponse:
    """
    Upload a document for BPMN process extraction.
    """
    
    # Validate MIME type
    if file.content_type not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Supported types: {', '.join(SUPPORTED_MIME_TYPES)}"
        )
    
    # Read file to check size
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size "
                   f"({MAX_FILE_SIZE} bytes / 30MB)"
        )
    
    # Generate unique artifact ID
    artifact_id = str(uuid.uuid4())
    storage_key = f"{artifact_id}/{file.filename}"
    
    # Upload to MinIO
    try:
        storage_service.put_object(storage_key, content, file.content_type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store file: {str(e)}"
        )
    
    # Create Artifact record
    artifact = Artifact(
        id=artifact_id,
        filename=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        storage_path=storage_key,
        storage_bucket=storage_service.bucket_name,
        status="uploaded"
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    
    # Trigger processing in background
    background_tasks.add_task(process_artifact, artifact_id)
    
    return IngestResponse(
        artifactId=artifact_id,
        filename=artifact.filename,
        fileSize=artifact.file_size,
        mimeType=artifact.mime_type,
        status=artifact.status,
        message=f"File uploaded successfully. Processing started."
    )


@router.get("/{artifact_id}/status")
async def get_artifact_status(artifact_id: str):
    """
    Get the processing status of an uploaded artifact.
    
    Returns:
    - status: Current processing status
    - progress: Processing progress (0-100)
    """
    # TODO: Query processing status from database
    
    return {
        "artifactId": artifact_id,
        "status": "uploaded",
        "progress": 0,
        "message": "Artifact uploaded, processing not yet implemented"
    }
