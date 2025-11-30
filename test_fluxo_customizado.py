#!/usr/bin/env python3
"""
Teste Completo - Upload de JSON e Geração (Sem Auth)
"""

import requests
import json
import sys
from pathlib import Path
import time

API_URL = "http://localhost:8000"
COLORS = {
    'GREEN': '\033[92m',
    'RED': '\033[91m',
    'YELLOW': '\033[93m',
    'BLUE': '\033[94m',
    'END': '\033[0m'
}

def print_success(msg): print(f"{COLORS['GREEN']}✅ {msg}{COLORS['END']}")
def print_error(msg): print(f"{COLORS['RED']}❌ {msg}{COLORS['END']}")
def print_info(msg): print(f"{COLORS['BLUE']}ℹ️  {msg}{COLORS['END']}")
def print_warning(msg): print(f"{COLORS['YELLOW']}⚠️  {msg}{COLORS['END']}")

def test_custom_flow():
    print(f"\n{COLORS['BLUE']}{'='*60}")
    print("🧪 TESTE DE FLUXO CUSTOMIZADO (JSON -> BPMN)")
    print(f"{'='*60}{COLORS['END']}\n")

    try:
        # 1. Definir Conteúdo Customizado (JSON Description)
        custom_content = {
            "process_name": "Processo de Reembolso",
            "steps": [
                {"type": "start", "name": "Solicitar Reembolso"},
                {"type": "task", "name": "Anexar Comprovantes"},
                {"type": "gateway", "name": "Valor > 1000?"},
                {"type": "task", "name": "Aprovação do Diretor", "condition": "Sim"},
                {"type": "task", "name": "Aprovação do Gerente", "condition": "Não"},
                {"type": "end", "name": "Pagamento Realizado"}
            ]
        }
        content_str = json.dumps(custom_content, indent=2, ensure_ascii=False)
        
        # 2. Upload do Arquivo (Auth desabilitada temporariamente)
        print_info("Fazendo upload do arquivo customizado...")
        files = {
            "files": ("processo_reembolso.json", content_str, "application/json")
        }
        
        # Nota: Sem headers de auth
        upload_response = requests.post(
            f"{API_URL}/api/v1/ingest/upload",
            files=files
        )
        
        if upload_response.status_code != 202:
            print_error(f"Erro no upload: {upload_response.text}")
            return

        upload_data = upload_response.json()
        artifact_id = upload_data["uploaded"][0]["id"]
        print_success(f"Upload realizado! ID: {artifact_id}")

        # 3. Gerar BPMN
        print_info("Gerando BPMN a partir do conteúdo customizado...")
        
        generate_payload = {
            "artifact_ids": [artifact_id],
            "process_name": "Processo de Reembolso",
            "options": {
                "apply_layout": True,
                "context_text": content_str  # Passando o conteúdo diretamente!
            }
        }
        
        gen_response = requests.post(
            f"{API_URL}/api/v1/generate",
            json=generate_payload
        )
        
        if gen_response.status_code == 200:
            data = gen_response.json()
            print_success("BPMN Gerado com Sucesso!")
            print(f"   🆔 ID: {data['model_version_id']}")
            print(f"   📊 Status: {data['status']}")
            
            metrics = data.get('metrics', {})
            print(f"   📈 Métricas: {metrics.get('nodes')} nós, {metrics.get('edges')} conexões")
            
            # Salvar XML
            xml = data['preview_xml']
            Path("bpmn_customizado.xml").write_text(xml)
            print_info(f"💾 XML salvo em: {Path('bpmn_customizado.xml').absolute()}")
            
            # Validar conteúdo
            if "Reembolso" in xml and "Diretor" in xml:
                print_success("✅ O diagrama contém os elementos do seu JSON!")
            else:
                print_warning("⚠️  O diagrama foi gerado, mas pode não ter usado seu conteúdo exato.")
                
        else:
            print_error(f"Erro na geração: {gen_response.text}")

    except Exception as e:
        print_error(f"Erro: {e}")

if __name__ == "__main__":
    test_custom_flow()
