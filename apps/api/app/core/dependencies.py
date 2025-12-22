"""
Dependency Injection for FastAPI

Provides dependencies for repositories and use cases.
"""

from functools import lru_cache
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.infrastructure.persistence.sqlalchemy import (
    SQLAlchemyProcessRepository,
    SQLAlchemyFolderRepository,
    SQLAlchemyVersionRepository
)
from app.domain.repositories.process_repository import ProcessRepository
from app.domain.repositories.folder_repository import FolderRepository
from app.domain.repositories.version_repository import VersionRepository
from app.application.processes.create_process import CreateProcessUseCase
from app.application.processes.update_process import UpdateProcessUseCase
from app.application.processes.delete_process import DeleteProcessUseCase
from app.application.processes.get_process import GetProcessUseCase
from app.application.processes.list_processes import ListProcessesUseCase
from app.application.versioning.create_version import CreateVersionUseCase
from app.application.folders.create_folder import CreateFolderUseCase
from app.application.folders.update_folder import UpdateFolderUseCase
from app.application.folders.delete_folder import DeleteFolderUseCase
from app.application.folders.get_folder import GetFolderUseCase
from app.application.folders.list_folders import ListFoldersUseCase
from app.application.bpmn.generate_bpmn import GenerateBpmnUseCase
from app.application.bpmn.edit_bpmn import EditBpmnUseCase
from app.application.bpmn.export_bpmn import ExportBpmnUseCase
from app.application.versioning.list_versions import ListVersionsUseCase
from app.application.versioning.get_version import GetVersionUseCase
from app.application.versioning.activate_version import ActivateVersionUseCase
from app.application.versioning.restore_version import RestoreVersionUseCase
from app.application.spaces.get_space_tree import GetSpaceTreeUseCase
from app.application.spaces.get_space_details import GetSpaceDetailsUseCase
from app.application.spaces.get_space_stats import GetSpaceStatsUseCase


# Repository dependencies
def get_process_repository(db: Session = None) -> ProcessRepository:
    """Get process repository instance"""
    if db is None:
        db = next(get_db())
    return SQLAlchemyProcessRepository(db)


def get_folder_repository(db: Session = None) -> FolderRepository:
    """Get folder repository instance"""
    if db is None:
        db = next(get_db())
    return SQLAlchemyFolderRepository(db)


def get_version_repository(db: Session = None) -> VersionRepository:
    """Get version repository instance"""
    if db is None:
        db = next(get_db())
    return SQLAlchemyVersionRepository(db)


# Use case dependencies
def get_create_process_use_case(db: Session = None) -> CreateProcessUseCase:
    """Get create process use case"""
    process_repo = get_process_repository(db)
    folder_repo = get_folder_repository(db)
    return CreateProcessUseCase(process_repo, folder_repo)


def get_update_process_use_case(db: Session = None) -> UpdateProcessUseCase:
    """Get update process use case"""
    process_repo = get_process_repository(db)
    folder_repo = get_folder_repository(db)
    return UpdateProcessUseCase(process_repo, folder_repo)


def get_delete_process_use_case(db: Session = None) -> DeleteProcessUseCase:
    """Get delete process use case"""
    process_repo = get_process_repository(db)
    return DeleteProcessUseCase(process_repo)


def get_get_process_use_case(db: Session = None) -> GetProcessUseCase:
    """Get get process use case"""
    process_repo = get_process_repository(db)
    return GetProcessUseCase(process_repo)


def get_list_processes_use_case(db: Session = None) -> ListProcessesUseCase:
    """Get list processes use case"""
    process_repo = get_process_repository(db)
    return ListProcessesUseCase(process_repo)


def get_create_version_use_case(db: Session = None) -> CreateVersionUseCase:
    """Get create version use case"""
    version_repo = get_version_repository(db)
    process_repo = get_process_repository(db)
    return CreateVersionUseCase(version_repo, process_repo)


def get_create_folder_use_case(db: Session = None) -> CreateFolderUseCase:
    """Get create folder use case"""
    folder_repo = get_folder_repository(db)
    return CreateFolderUseCase(folder_repo)


def get_update_folder_use_case(db: Session = None) -> UpdateFolderUseCase:
    """Get update folder use case"""
    folder_repo = get_folder_repository(db)
    return UpdateFolderUseCase(folder_repo)


def get_delete_folder_use_case(db: Session = None) -> DeleteFolderUseCase:
    """Get delete folder use case"""
    folder_repo = get_folder_repository(db)
    process_repo = get_process_repository(db)
    return DeleteFolderUseCase(folder_repo, process_repo)


def get_get_folder_use_case(db: Session = None) -> GetFolderUseCase:
    """Get get folder use case"""
    folder_repo = get_folder_repository(db)
    return GetFolderUseCase(folder_repo)


def get_list_folders_use_case(db: Session = None) -> ListFoldersUseCase:
    """Get list folders use case"""
    folder_repo = get_folder_repository(db)
    return ListFoldersUseCase(folder_repo)


def get_generate_bpmn_use_case(db: Session = None) -> GenerateBpmnUseCase:
    """Get generate BPMN use case"""
    process_repo = get_process_repository(db)
    folder_repo = get_folder_repository(db)
    version_repo = get_version_repository(db)
    return GenerateBpmnUseCase(process_repo, folder_repo, version_repo)


def get_edit_bpmn_use_case(db: Session = None) -> EditBpmnUseCase:
    """Get edit BPMN use case"""
    version_repo = get_version_repository(db)
    return EditBpmnUseCase(version_repo)


def get_export_bpmn_use_case() -> ExportBpmnUseCase:
    """Get export BPMN use case"""
    return ExportBpmnUseCase()


def get_list_versions_use_case(db: Session = None) -> ListVersionsUseCase:
    """Get list versions use case"""
    version_repo = get_version_repository(db)
    process_repo = get_process_repository(db)
    return ListVersionsUseCase(version_repo, process_repo)


def get_get_version_use_case(db: Session = None) -> GetVersionUseCase:
    """Get get version use case"""
    version_repo = get_version_repository(db)
    process_repo = get_process_repository(db)
    return GetVersionUseCase(version_repo, process_repo)


def get_activate_version_use_case(db: Session = None) -> ActivateVersionUseCase:
    """Get activate version use case"""
    version_repo = get_version_repository(db)
    process_repo = get_process_repository(db)
    return ActivateVersionUseCase(version_repo, process_repo)


def get_restore_version_use_case(db: Session = None) -> RestoreVersionUseCase:
    """Get restore version use case"""
    version_repo = get_version_repository(db)
    process_repo = get_process_repository(db)
    return RestoreVersionUseCase(version_repo, process_repo)


def get_space_details_use_case(db: Session = None) -> GetSpaceDetailsUseCase:
    """Get space details use case"""
    folder_repo = get_folder_repository(db)
    process_repo = get_process_repository(db)
    return GetSpaceDetailsUseCase(folder_repo, process_repo)


def get_space_stats_use_case(db: Session = None) -> GetSpaceStatsUseCase:
    """Get space stats use case"""
    folder_repo = get_folder_repository(db)
    process_repo = get_process_repository(db)
    return GetSpaceStatsUseCase(folder_repo, process_repo)
