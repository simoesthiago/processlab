"""
Common BPMN schemas shared across the API.

Centralizes import of shared BPMN models from packages/shared-schemas.
"""

import sys
from pathlib import Path

# Find the monorepo root (contains packages/ directory)
current_file = Path(__file__).resolve()
monorepo_root = current_file.parent.parent.parent.parent.parent
while not (monorepo_root / "packages").exists() and monorepo_root.parent != monorepo_root:
    monorepo_root = monorepo_root.parent

# Add shared-schemas to path
shared_schemas_path = monorepo_root / "packages" / "shared-schemas" / "src"
if shared_schemas_path.exists() and str(shared_schemas_path) not in sys.path:
    sys.path.insert(0, str(shared_schemas_path))

try:
    # Import shared BPMN models
    from models import BPMNJSON, BPMNElement, SequenceFlow, Lane, ProcessInfo, ElementMeta
except ImportError:
    # Fallback: create stub models if shared schema not available
    from pydantic import BaseModel
    class BPMNJSON(BaseModel):
        """BPMN JSON model (stub if shared schema not available)"""
        pass
    class BPMNElement(BaseModel):
        """BPMN Element model (stub if shared schema not available)"""
        pass
    class SequenceFlow(BaseModel):
        """Sequence Flow model (stub if shared schema not available)"""
        pass
    class Lane(BaseModel):
        """Lane model (stub if shared schema not available)"""
        pass
    class ProcessInfo(BaseModel):
        """Process Info model (stub if shared schema not available)"""
        pass
    class ElementMeta(BaseModel):
        """Element Meta model (stub if shared schema not available)"""
        pass

__all__ = [
    "BPMNJSON",
    "BPMNElement",
    "SequenceFlow",
    "Lane",
    "ProcessInfo",
    "ElementMeta",
]

