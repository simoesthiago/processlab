"""
Upload Artifact Use Case
"""

from typing import List
from app.db.models import Artifact, LOCAL_USER_ID
from sqlalchemy.orm import Session
import uuid


class UploadArtifactCommand:
    """Command for uploading an artifact"""
    
    def __init__(
        self,
        filename: str,
        mime_type: str,
        file_size: int,
        storage_path: str
    ):
        self.filename = filename
        self.mime_type = mime_type
        self.file_size = file_size
        self.storage_path = storage_path


class UploadArtifactResult:
    """Result of artifact upload"""
    
    def __init__(self, artifact_id: str, filename: str, status: str):
        self.artifact_id = artifact_id
        self.filename = filename
        self.status = status


class UploadArtifactUseCase:
    """Use case for uploading artifacts"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def execute(self, command: UploadArtifactCommand) -> UploadArtifactResult:
        """Execute the upload artifact use case"""
        # Create Artifact record
        artifact = Artifact(
            filename=command.filename,
            mime_type=command.mime_type,
            file_size=command.file_size,
            storage_path=command.storage_path,
            uploaded_by=LOCAL_USER_ID,
            status="uploaded"
        )
        self.db.add(artifact)
        self.db.commit()
        self.db.refresh(artifact)
        
        return UploadArtifactResult(
            artifact_id=artifact.id,
            filename=artifact.filename,
            status=artifact.status
        )

