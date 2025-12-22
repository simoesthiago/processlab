"""
List Versions Use Case
"""

from typing import List
from app.domain.repositories.version_repository import VersionRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError
from app.api.versioning import VersionHistoryItem


class ListVersionsUseCase:
    """Use case for listing process versions"""
    
    def __init__(
        self,
        version_repo: VersionRepository,
        process_repo: ProcessRepository
    ):
        self.version_repo = version_repo
        self.process_repo = process_repo
    
    def execute(self, process_id: str):
        """Execute the list versions use case"""
        # Validate process exists
        process = self.process_repo.find_by_id(process_id)
        if not process:
            raise ResourceNotFoundError("Process", process_id)
        
        # Get versions
        versions = self.version_repo.find_by_process_id(process_id)
        
        # Convert to history items
        history_items = []
        for v in versions:
            item = VersionHistoryItem.model_validate({
                "id": v.id,
                "version_number": v.version_number,
                "version_label": v.version_label,
                "commit_message": v.commit_message,
                "created_at": v.created_at,
                "created_by": v.created_by,
                "change_type": v.change_type,
                "is_active": (v.id == process.current_version_id)
            })
            history_items.append(item)
        
        return {
            "process_id": process_id,
            "process_name": process.name,
            "versions": history_items,
            "total_count": len(history_items)
        }

