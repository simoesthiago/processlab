#!/usr/bin/env python3
"""
Script de Teste - Geração de Fluxos BPMN
Testa a geração de BPMN diretamente via API.

NOTA: Este script usa o endpoint /generate diretamente, pulando a etapa de ingestão
que requer autenticação. O backend usa um texto de exemplo quando nenhum artifact_id
válido é encontrado no banco de dados (mock mode).
"""

import requests
import json
import sys
from pathlib import Path
import time

# Configuração
API_URL = "http://localhost:8000"
COLORS = {
    'GREEN': '\033[92m',
    'RED': '\033[91m',
    'YELLOW': '\033[93m',
    'BLUE': '\033[94m',
    'END': '\033[0m'
}

def print_success(msg):
    print(f"{COLORS['GREEN']}✅ {msg}{COLORS['END']}")

def print_error(msg):
    print(f"{COLORS['RED']}❌ {msg}{COLORS['END']}")

def print_info(msg):
    print(f"{COLORS['BLUE']}ℹ️  {msg}{COLORS['END']}")

def print_warning(msg):
    print(f"{COLORS['YELLOW']}⚠️  {msg}{COLORS['END']}")

def check_api_health():
    """Verifica se a API está rodando"""
    print_info("Verificando saúde da API...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("API está rodando!")
            return True
        else:
            print_error(f"API retornou status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Não foi possível conectar à API. Certifique-se de que está rodando em http://localhost:8000")
        print_info("Execute: make compose-up")
        return False
    except Exception as e:
        print_error(f"Erro ao verificar API: {e}")
        return False

def test_generate_direct():
    """Testa geração de BPMN"""
    print_info("\n[1/2] Testando geração de BPMN...")
    print_info("(Usando modo direto sem upload prévio)")
    
    try:
        start_time = time.time()
        
        # Usamos um ID fictício. O backend irá usar um texto de exemplo
        # quando não encontrar o artifact no banco (comportamento de dev/test)
        payload = {
            "artifact_ids": ["test-artifact-id"],
            "process_name": "Processo de Teste",
            "options": {
                "apply_layout": True
            }
        }
        
        response = requests.post(
            f"{API_URL}/api/v1/generate",
            json=payload,
            timeout=60
        )
        
        duration = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"BPMN gerado com sucesso em {duration:.2f}s!")
            print(f"   🆔 Model Version ID: {data.get('model_version_id')}")
            print(f"   📊 Status: {data.get('status')}")
            
            metrics = data.get('metrics', {})
            print(f"   📈 Métricas:")
            print(f"      - Nós (elementos): {metrics.get('nodes', 0)}")
            print(f"      - Conexões (flows): {metrics.get('edges', 0)}")
            print(f"      - Duração: {metrics.get('duration', 0):.2f}s")
            
            return data
        else:
            print_error(f"Falha na geração: {response.status_code}")
            print(f"   Resposta: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print_error("Timeout na geração (> 60s)")
        return None
    except Exception as e:
        print_error(f"Erro durante geração: {e}")
        return None

def validate_bpmn_xml(xml_content):
    """Valida estrutura do XML BPMN"""
    print_info("\n[2/2] Validando XML BPMN...")
    
    validations = {
        "Declaração XML": '<?xml version' in xml_content,
        "Namespace BPMN": 'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' in xml_content,
        "Definitions": '<bpmn:definitions' in xml_content,
        "Process": '<bpmn:process' in xml_content,
        "StartEvent": '<bpmn:startEvent' in xml_content,
        "EndEvent": '<bpmn:endEvent' in xml_content,
        "SequenceFlow": '<bpmn:sequenceFlow' in xml_content,
        "Diagram": '<bpmndi:BPMNDiagram' in xml_content,
    }
    
    all_passed = True
    for check, passed in validations.items():
        if passed:
            print_success(f"{check}: OK")
        else:
            print_warning(f"{check}: NÃO ENCONTRADO")
            all_passed = False
    
    return all_passed

def save_xml_output(xml_content):
    """Salva XML gerado para inspeção"""
    output_file = Path("bpmn_gerado.xml")
    output_file.write_text(xml_content)
    print_info(f"\n💾 XML salvo em: {output_file.absolute()}")
    print_info("   Você pode abrir este arquivo em ferramentas como Camunda Modeler")

def main():
    print(f"\n{COLORS['BLUE']}{'='*60}")
    print("🧪 TESTE DE GERAÇÃO DE FLUXOS BPMN - ProcessLab")
    print(f"{'='*60}{COLORS['END']}\n")
    
    # 1. Verificar API
    if not check_api_health():
        sys.exit(1)
    
    # 2. Testar Geração (Direta)
    result = test_generate_direct()
    if not result:
        print_error("\n❌ Teste falhou na etapa de geração")
        sys.exit(1)
    
    # 3. Validar XML
    xml_content = result.get('preview_xml', '')
    if not xml_content:
        print_error("\n❌ XML não foi retornado na resposta")
        sys.exit(1)
    
    xml_valid = validate_bpmn_xml(xml_content)
    
    # 4. Salvar resultado
    save_xml_output(xml_content)
    
    # Resumo Final
    print(f"\n{COLORS['BLUE']}{'='*60}")
    if xml_valid:
        print_success("✅ TODOS OS TESTES PASSARAM!")
        print_info("\n📋 Próximos passos:")
        print("   1. Abra http://localhost:3000/studio no navegador")
        print("   2. Importe o arquivo bpmn_gerado.xml")
        print("   3. Verifique a visualização e teste o Auto Layout")
    else:
        print_warning("⚠️  TESTES PASSARAM COM AVISOS")
        print_info("   Algumas validações falharam, mas o XML foi gerado")
    print(f"{'='*60}{COLORS['END']}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_warning("\n\n⚠️  Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n\n❌ Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
