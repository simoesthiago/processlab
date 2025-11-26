"""
Ingest API - Multimodal File Upload

Handles upload of various document formats (PDF, DOCX, images, text).
Maximum file size: 30MB per upload.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.schemas import IngestResponse
import uuid
from typing import Optional

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
    file: UploadFile = File(..., description="Document to upload (max 30MB)")
) -> IngestResponse:
    """
    Upload a document for BPMN process extraction.
    
    Supported formats:
    - PDF (.pdf)
    - Word Documents (.doc, .docx)
    - Images (.png, .jpg, .jpeg)
    - Plain Text (.txt)
    
    Maximum file size: 30MB
    
    Returns:
    - artifactId: Unique identifier for the uploaded document
    - status: Upload status (uploaded, processing, failed)
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
    artifact_id = f"artifact_{uuid.uuid4().hex[:12]}"
    
    # TODO: Store file in object storage (MinIO/S3)
    # TODO: Trigger RAG processing pipeline
    # TODO: Extract text and create embeddings
    
    return IngestResponse(
        artifactId=artifact_id,
        filename=file.filename or "unknown",
        fileSize=file_size,
        mimeType=file.content_type or "application/octet-stream",
        status="uploaded",
        message=f"File uploaded successfully. Processing will begin shortly."
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
