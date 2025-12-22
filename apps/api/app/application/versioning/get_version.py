"""
Get Version Use Case
"""

from app.domain.repositories.version_repository import VersionRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError


class GetVersionUseCase:
    """Use case for getting a version"""
    
    def __init__(
        self,
        version_repo: VersionRepository,
        process_repo: ProcessRepository
    ):
        self.version_repo = version_repo
        self.process_repo = process_repo
    
    def execute(self, process_id: str, version_id: str):
        """Execute the get version use case"""
        # Validate process exists
        process = self.process_repo.find_by_id(process_id)
        if not process:
            raise ResourceNotFoundError("Process", process_id)
        
        # Get version
        version = self.version_repo.find_by_id(version_id)
        if not version or version.process_id != process_id:
            raise ResourceNotFoundError("Version", version_id)
        
        xml_content = version.bpmn_json.get('xml', '') if version.bpmn_json else ''
        
        return {
            "id": version.id,
            "version_number": version.version_number,
            "version_label": version.version_label,
            "commit_message": version.commit_message,
            "created_at": version.created_at,
            "created_by": version.created_by,
            "change_type": version.change_type,
            "is_active": (version.id == process.current_version_id),
            "etag": version.etag,
            "xml": xml_content,
            "bpmn_json": version.bpmn_json
        }

