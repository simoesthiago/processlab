"""
Restore Version Use Case
"""

from typing import Optional
from app.domain.repositories.version_repository import VersionRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError
from app.application.versioning.create_version import CreateVersionCommand, CreateVersionUseCase
import json
import hashlib


class RestoreVersionUseCase:
    """Use case for restoring a version"""
    
    def __init__(
        self,
        version_repo: VersionRepository,
        process_repo: ProcessRepository
    ):
        self.version_repo = version_repo
        self.process_repo = process_repo
    
    def _compute_etag(self, payload: dict) -> str:
        """Generate deterministic etag"""
        serialized = json.dumps(payload or {}, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    
    def execute(self, process_id: str, version_id: str, commit_message: Optional[str] = None):
        """Execute the restore version use case"""
        # Validate process exists
        process = self.process_repo.find_by_id(process_id)
        if not process:
            raise ResourceNotFoundError("Process", process_id)
        
        # Get source version
        source_version = self.version_repo.find_by_id(version_id)
        if not source_version or source_version.process_id != process_id:
            raise ResourceNotFoundError("Version", version_id)
        
        # Get latest version to determine next version number
        existing_versions = self.version_repo.find_by_process_id(process_id)
        next_version_number = (existing_versions[0].version_number + 1) if existing_versions else 1
        
        # Create new version from source
        create_version_use_case = CreateVersionUseCase(self.version_repo, self.process_repo)
        
        version_command = CreateVersionCommand(
            process_id=process_id,
            bpmn_json=dict(source_version.bpmn_json) if source_version.bpmn_json else {},
            generation_method="restored",
            version_label=f"v{next_version_number}",
            commit_message=commit_message or f"Restored to version {source_version.version_number}",
            change_type="major",
            parent_version_id=process.current_version_id,
            source_artifact_ids=source_version.source_artifact_ids,
            is_active=True
        )
        
        restored_version = create_version_use_case.execute(version_command)
        
        return restored_version

