"""
API Schemas Module

Centralized location for all API request/response schemas.
"""

# Common BPMN types
from .common import (
    BPMNJSON,
    BPMNElement,
    SequenceFlow,
    Lane,
    ProcessInfo,
    ElementMeta,
)

# Process schemas
from .processes import ProcessResponse

# Folder schemas
from .folders import (
    FolderResponse,
    FolderCreateRequest,
    FolderUpdateRequest,
    FolderTree,
    FolderItem,
    FolderPathItem,
    FolderPathResponse,
    # Backward compatibility
    FolderCreate,
    FolderUpdate,
)

# Space schemas
from .spaces import (
    SpaceTreeResponse,
    SpaceSummary,
    RecentItem,
    RecentsResponse,
    SpaceListResponse,
    SpaceDetailResponse,
    SpaceProcessCreateRequest,
    SpaceProcessUpdateRequest,
    FolderMoveRequest,
    ProcessMoveRequest,
    SpaceStatsResponse,
    # Backward compatibility
    SpaceProcessCreate,
    SpaceProcessUpdate,
)

# Version schemas
from .versions import (
    VersionCreateRequest,
    VersionResponse,
    VersionHistoryItem,
    RestoreVersionRequest,
    # Backward compatibility
    ModelVersionCreate,
    ModelVersionResponse,
)

# BPMN Operations schemas
from .bpmn_operations import (
    GenerateRequest,
    GenerateResponse,
    EditRequest,
    EditResponse,
    ExportRequest,
    ExportResponse,
    IngestResponse,
)

# Governance schemas
from .governance import ConflictError

__all__ = [
    # Common
    "BPMNJSON",
    "BPMNElement",
    "SequenceFlow",
    "Lane",
    "ProcessInfo",
    "ElementMeta",
    # Processes
    "ProcessResponse",
    # Folders
    "FolderResponse",
    "FolderCreateRequest",
    "FolderUpdateRequest",
    "FolderTree",
    "FolderItem",
    "FolderPathItem",
    "FolderPathResponse",
    "FolderCreate",  # Backward compatibility
    "FolderUpdate",  # Backward compatibility
    # Spaces
    "SpaceTreeResponse",
    "SpaceSummary",
    "RecentItem",
    "RecentsResponse",
    "SpaceListResponse",
    "SpaceDetailResponse",
    "SpaceProcessCreateRequest",
    "SpaceProcessUpdateRequest",
    "FolderMoveRequest",
    "ProcessMoveRequest",
    "SpaceStatsResponse",
    "SpaceProcessCreate",  # Backward compatibility
    "SpaceProcessUpdate",  # Backward compatibility
    # Versions
    "VersionCreateRequest",
    "VersionResponse",
    "VersionHistoryItem",
    "RestoreVersionRequest",
    "ModelVersionCreate",  # Backward compatibility
    "ModelVersionResponse",  # Backward compatibility
    # BPMN Operations
    "GenerateRequest",
    "GenerateResponse",
    "EditRequest",
    "EditResponse",
    "ExportRequest",
    "ExportResponse",
    "IngestResponse",
    # Governance
    "ConflictError",
]

