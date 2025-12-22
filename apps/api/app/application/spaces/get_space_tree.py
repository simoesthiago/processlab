"""
Get Space Tree Use Case
"""

from typing import Dict, List
from app.domain.repositories.folder_repository import FolderRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.api.hierarchy import FolderTree
from app.api.processes import ProcessResponse
from datetime import datetime


class GetSpaceTreeUseCase:
    """Use case for building space tree"""
    
    def __init__(
        self,
        folder_repo: FolderRepository,
        process_repo: ProcessRepository
    ):
        self.folder_repo = folder_repo
        self.process_repo = process_repo
    
    def _safe_process_response(self, process) -> ProcessResponse:
        """Safely convert Process entity to ProcessResponse"""
        return ProcessResponse(
            id=process.id,
            name=process.name or "Unnamed Process",
            description=process.description,
            folder_id=process.folder_id,
            user_id="local-user",
            current_version_id=process.current_version_id,
            created_at=process.created_at or datetime.utcnow(),
            updated_at=process.updated_at or datetime.utcnow(),
            version_count=0,
        )
    
    def _build_tree_node(
        self,
        folder,
        folder_children: Dict[str | None, List],
        process_by_folder: Dict[str | None, List]
    ) -> FolderTree:
        """Recursively build tree node"""
        children = folder_children.get(folder.id, [])
        processes_here = process_by_folder.get(folder.id, [])
        
        return FolderTree(
            id=folder.id,
            user_id="local-user",
            parent_folder_id=folder.parent_folder_id,
            name=folder.name,
            description=folder.description,
            color=folder.color,
            icon=folder.icon,
            position=folder.position or 0,
            created_at=folder.created_at,
            updated_at=folder.updated_at,
            process_count=len(processes_here),
            child_count=len(children),
            processes=[self._safe_process_response(p) for p in processes_here],
            children=[self._build_tree_node(child, folder_children, process_by_folder) for child in children],
        )
    
    def execute(self, space_id: str):
        """Execute the get space tree use case"""
        # Get all folders and processes
        folders = self.folder_repo.find_all()
        processes = self.process_repo.find_all()
        
        # Organize by parent
        folder_children: Dict[str | None, List] = {}
        for folder in folders:
            folder_children.setdefault(folder.parent_folder_id, []).append(folder)
        
        process_by_folder: Dict[str | None, List] = {}
        for process in processes:
            process_by_folder.setdefault(process.folder_id, []).append(process)
        
        # Sort
        for key in folder_children:
            folder_children[key] = sorted(
                folder_children[key], key=lambda f: (f.position or 0, f.name.lower())
            )
        for key in process_by_folder:
            process_by_folder[key] = sorted(
                process_by_folder[key], key=lambda p: (p.position or 0, p.name.lower())
            )
        
        # Build root folders
        root_folders = [
            self._build_tree_node(f, folder_children, process_by_folder)
            for f in folder_children.get(None, [])
        ]
        
        # Build root processes
        root_processes = [
            self._safe_process_response(p)
            for p in process_by_folder.get(None, [])
        ]
        
        return {
            "space_type": "private",
            "space_id": space_id,
            "root_folders": root_folders,
            "root_processes": root_processes
        }

