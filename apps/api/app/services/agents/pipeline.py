"""
Generation Pipeline
Orchestrates the RAG -> Synthesis -> Lint -> Convert -> Layout flow.
"""
from typing import List, Dict, Any
from app.services.agents import synthesis, linter, layout, supervisor
from app.services.bpmn import json_to_xml
# from app.services.rag import retriever # TODO: Import RAG service

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
        # TODO: Call actual RAG service
        # text = await retriever.get_consolidated_text(artifact_ids)
        text = "Exemplo de processo. O usuário inicia a tarefa. Se aprovado, segue para fim. Caso contrário, revisa."
        sup.log_step("retrieve", meta={"artifact_count": len(artifact_ids)})
        
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
