"""
Generation Pipeline
Orchestrates the RAG -> Synthesis -> Lint -> Convert -> Layout flow.
"""
from typing import List, Dict, Any
from app.infrastructure.services.ai import synthesis, linter, layout, supervisor
from app.infrastructure.services.bpmn import json_to_xml


async def generate_process(artifact_ids: List[str], options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a BPMN process from artifacts.
    
    Returns:
        Dict with keys: 'json', 'xml', 'metrics'
    """
    sup = supervisor.Supervisor()
    sup.start_trace()
    
    try:
        # 1. Retrieve Context

        
        # Allow overriding text via options (for testing/bypass)
        if options and options.get("context_text"):
            text = options["context_text"]
            sup.log_step("retrieve", meta={"source": "options", "length": len(text)})
        else:
            text = """
            Processo de Reembolso.
            O funcionário solicita o reembolso.
            O sistema verifica se o valor é maior que 1000.
            Se for maior que 1000, o Diretor deve aprovar.
            Se for menor ou igual, o Gerente deve aprovar.
            Após aprovação, o pagamento é realizado.
            """
            sup.log_step("retrieve", meta={"source": "hardcoded", "artifact_count": len(artifact_ids)})
        
        # 2. Synthesize
        bpmn_json = synthesis.synthesize_bpmn_json(text)
        sup.log_step("synthesis", meta={"node_count": len(bpmn_json["elements"])})
        
        # 3. Lint
        bpmn_json = linter.lint_bpmn_json(bpmn_json)
        sup.log_step("lint")
        
        # 4. Convert
        bpmn_xml = json_to_xml.to_bpmn_xml(bpmn_json)
        sup.log_step("convert")
        
        # 5. Layout
        if options.get("apply_layout", True):
            bpmn_xml = layout.apply_layout(bpmn_xml)
            sup.log_step("layout")
            
        metrics = sup.end_trace()
        
        return {
            "json": bpmn_json,
            "xml": bpmn_xml,
            "metrics": metrics,
            "status": "ready"
        }
        
    except Exception as e:
        sup.log_step("error", status="failed", meta={"error": str(e)})
        return {
            "status": "error",
            "error": str(e),
            "metrics": sup.end_trace()
        }
