"""
BPMN JSON Schema Models

Auto-generated Pydantic models from bpmn_json.schema.json
DO NOT EDIT MANUALLY - regenerate using: pnpm run generate:py
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ProcessInfo(BaseModel):
    """Process metadata"""
    id: str
    name: Optional[str] = None
    documentation: Optional[str] = None


class Lane(BaseModel):
    """Lane or pool definition for hierarchical layout"""
    id: str
    name: str
    childElementIds: Optional[List[str]] = Field(default_factory=list)


class ElementMeta(BaseModel):
    """Metadata for RAG traceability"""
    sourceArtifactId: Optional[str] = None
    pageNumber: Optional[int] = None


class BPMNElement(BaseModel):
    """BPMN element (task, event, gateway)"""
    id: str
    type: Literal[
        "task",
        "userTask",
        "serviceTask",
        "startEvent",
        "endEvent",
        "exclusiveGateway",
        "parallelGateway"
    ]
    name: Optional[str] = None
    laneId: Optional[str] = Field(
        None,
        description="Reference to the lane where the element resides"
    )
    meta: Optional[ElementMeta] = None


class SequenceFlow(BaseModel):
    """Sequence flow connecting elements"""
    id: Optional[str] = None
    source: str
    target: str
    type: str = Field(default="sequenceFlow")
    name: Optional[str] = None


class BPMNJSON(BaseModel):
    """
    BPMN JSON Format
    
    Robust intermediate format for BPMN process synthesis and editing.
    This is the internal representation used throughout ProcessLab.
    XML conversion happens only at export/visualization time.
    """
    process: ProcessInfo
    lanes: Optional[List[Lane]] = Field(
        default_factory=list,
        description="Pool and lane definitions for hierarchical layout (ELK.js)"
    )
    elements: List[BPMNElement]
    flows: List[SequenceFlow]

    class Config:
        json_schema_extra = {
            "example": {
                "process": {
                    "id": "Process_1",
                    "name": "Sample Process",
                    "documentation": "A sample BPMN process"
                },
                "lanes": [
                    {
                        "id": "Lane_1",
                        "name": "Sales Department",
                        "childElementIds": ["Task_1", "Task_2"]
                    }
                ],
                "elements": [
                    {
                        "id": "StartEvent_1",
                        "type": "startEvent",
                        "name": "Start",
                        "laneId": "Lane_1"
                    },
                    {
                        "id": "Task_1",
                        "type": "userTask",
                        "name": "Review Request",
                        "laneId": "Lane_1",
                        "meta": {
                            "sourceArtifactId": "doc_123",
                            "pageNumber": 5
                        }
                    }
                ],
                "flows": [
                    {
                        "id": "Flow_1",
                        "source": "StartEvent_1",
                        "target": "Task_1",
                        "type": "sequenceFlow"
                    }
                ]
            }
        }
