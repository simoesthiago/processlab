"""
Test BPMN Linter Rules
"""

from app.services.agents.linter import BpmnLinter
from app.schemas import BPMNJSON, BPMNElement, SequenceFlow, ProcessInfo

linter = BpmnLinter()

def test_linter_start_event_missing():
    """Test that linter detects missing start events"""
    bpmn = BPMNJSON(
        process=ProcessInfo(id="proc1"),
        elements=[
            BPMNElement(id="task1", type="task", name="Task")
        ],
        flows=[]
    )
    
    errors = linter.lint(bpmn)
    
    assert len(errors) > 0
    assert any("Start Event" in e for e in errors)

def test_linter_end_event_missing():
    """Test that linter detects missing end events"""
    bpmn = BPMNJSON(
        process=ProcessInfo(id="proc1"),
        elements=[
            BPMNElement(id="start", type="startEvent", name="Start")
        ],
        flows=[]
    )
    
    errors = linter.lint(bpmn)
    
    assert len(errors) > 0
    assert any("End Event" in e for e in errors)

def test_linter_disconnected_node():
    """Test that linter detects disconnected nodes"""
    bpmn = BPMNJSON(
        process=ProcessInfo(id="proc1"),
        elements=[
            BPMNElement(id="start", type="startEvent", name="Start"),
            BPMNElement(id="task1", type="task", name="Task"),
            BPMNElement(id="end", type="endEvent", name="End")
        ],
        flows=[]
    )
    
    errors = linter.lint(bpmn)
    
    # Should have errors about unreachable/dead-end nodes
    assert len(errors) > 0
