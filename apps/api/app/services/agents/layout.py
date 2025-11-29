"""
Layout Facade
Handles graph layout using ELK.js (or stub).
"""
from typing import Dict, Any

def apply_layout(bpmn_xml: str) -> str:
    """
    Apply layout to BPMN XML.
    
    Strategy:
    - If backend ELK service is available, call it.
    - Else, return original XML and rely on frontend layout.
    
    For Sprint 3: Return original XML (Frontend strategy).
    """
    # TODO: Implement subprocess call to node elk-cli if needed
    return bpmn_xml
