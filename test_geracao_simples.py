#!/usr/bin/env python3
"""
Teste Simplificado - Geração de BPMN
Testa apenas o endpoint /generate (sem autenticação)
"""

import requests
import json
from pathlib import Path

API_URL = "http://localhost:8000"

def test_generate_direct():
    """Testa geração de BPMN diretamente (usa texto hardcoded no backend)"""
    
    print("\n" + "="*60)
    print("🧪 TESTE SIMPLIFICADO - Geração de BPMN")
    print("="*60 + "\n")
    
    # 1. Verificar API
    print("ℹ️  Verificando API...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API está rodando!\n")
        else:
            print(f"❌ API retornou status {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Erro ao conectar à API: {e}")
        print("💡 Execute: make compose-up")
        return
    
    # 2. Testar geração
    print("ℹ️  Testando geração de BPMN...")
    print("   (usando texto de exemplo do backend)\n")
    
    try:
        payload = {
            "artifact_ids": ["exemplo-123"],
            "process_name": "Processo de Teste",
            "options": {"apply_layout": True}
        }
        
        response = requests.post(
            f"{API_URL}/api/v1/generate",
            json=payload,
            timeout=60
        )
        
        print(f"📡 Status da resposta: {response.status_code}")
        print(f"📄 Resposta completa:\n{response.text}\n")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ BPMN gerado com sucesso!\n")
            print(f"🆔 Model Version ID: {data.get('model_version_id')}")
            print(f"📊 Status: {data.get('status')}")
            
            metrics = data.get('metrics', {})
            print(f"\n📈 Métricas:")
            print(f"   - Nós: {metrics.get('nodes', 0)}")
            print(f"   - Conexões: {metrics.get('edges', 0)}")
            print(f"   - Duração: {metrics.get('duration', 0):.2f}s")
            
            # Salvar XML
            xml = data.get('preview_xml', '')
            if xml:
                output_file = Path("bpmn_gerado.xml")
                output_file.write_text(xml)
                print(f"\n💾 XML salvo em: {output_file.absolute()}")
                print(f"   Tamanho: {len(xml)} caracteres")
                
                # Validações básicas
                print(f"\n🔍 Validações:")
                checks = {
                    "Declaração XML": '<?xml version' in xml,
                    "Namespace BPMN": 'xmlns:bpmn=' in xml,
                    "Process": '<bpmn:process' in xml,
                    "StartEvent": '<bpmn:startEvent' in xml,
                }
                for check, passed in checks.items():
                    status = "✅" if passed else "❌"
                    print(f"   {status} {check}")
            
            print(f"\n{'='*60}")
            print("✅ TESTE CONCLUÍDO COM SUCESSO!")
            print("="*60 + "\n")
            
        elif response.status_code == 500:
            print("❌ Erro interno do servidor")
            try:
                error_data = response.json()
                print(f"   Detalhes: {error_data.get('detail', 'Sem detalhes')}")
            except:
                pass
        else:
            print(f"❌ Erro: {response.status_code}")
            print(f"   Resposta: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Timeout (> 60s)")
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generate_direct()
