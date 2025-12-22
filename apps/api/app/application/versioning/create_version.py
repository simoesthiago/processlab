"""
Create Version Use Case
"""

from typing import Optional, Dict, Any, List
from app.domain.entities.version import ModelVersion
from app.domain.repositories.version_repository import VersionRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError


class CreateVersionCommand:
    """Command for creating a version"""
    
    def __init__(
        self,
        process_id: str,
        bpmn_json: Dict[str, Any],
        version_label: Optional[str] = None,
        commit_message: Optional[str] = None,
        change_type: str = "minor",
        parent_version_id: Optional[str] = None,
        generation_method: str = "manual_edit",
        source_artifact_ids: Optional[List[str]] = None,
        generation_prompt: Optional[str] = None,
        is_active: bool = False
    ):
        self.process_id = process_id
        self.bpmn_json = bpmn_json
        self.version_label = version_label
        self.commit_message = commit_message
        self.change_type = change_type
        self.parent_version_id = parent_version_id
        self.generation_method = generation_method
        self.source_artifact_ids = source_artifact_ids
        self.generation_prompt = generation_prompt
        self.is_active = is_active


class CreateVersionUseCase:
    """Use case for creating a new version"""
    
    def __init__(
        self,
        version_repo: VersionRepository,
        process_repo: ProcessRepository
    ):
        self.version_repo = version_repo
        self.process_repo = process_repo
    
    def execute(self, command: CreateVersionCommand) -> ModelVersion:
        """Execute the create version use case"""
        # Validate process exists
        process = self.process_repo.find_by_id(command.process_id)
        if not process:
            raise ResourceNotFoundError("Process", command.process_id)
        
        # Get next version number
        existing_versions = self.version_repo.find_by_process_id(command.process_id)
        next_version_number = (existing_versions[0].version_number + 1) if existing_versions else 1
        
        # Validate parent version if provided
        if command.parent_version_id:
            parent = self.version_repo.find_by_id(command.parent_version_id)
            if not parent or parent.process_id != command.process_id:
                raise ResourceNotFoundError("Parent Version", command.parent_version_id)
        
        # Create version entity
        version = ModelVersion.create(
            process_id=command.process_id,
            version_number=next_version_number,
            bpmn_json=command.bpmn_json,
            generation_method=command.generation_method,
            version_label=command.version_label,
            commit_message=command.commit_message,
            change_type=command.change_type,
            parent_version_id=command.parent_version_id,
            source_artifact_ids=command.source_artifact_ids,
            generation_prompt=command.generation_prompt,
            is_active=command.is_active or next_version_number == 1
        )
        
        # Save version
        saved_version = self.version_repo.save(version)
        
        # Update process current_version_id if active
        if saved_version.is_active:
            process.current_version_id = saved_version.id
            self.process_repo.save(process)
        
        return saved_version

