# 🚀 Teste Rápido do Diff Visual

## Opção 1: Teste Rápido (Recomendado) - Criar Versões Diretamente

Você pode criar versões diretamente via API sem precisar de artifact-id real!

### Passo 1: Obter Token e Processo

```bash
# 1. Faça login e obtenha o token JWT (no browser, localStorage.getItem('auth_token'))
TOKEN="seu-token-jwt"

# 2. Obtenha um project_id (ou crie um projeto)
PROJECT_ID="id-do-seu-projeto"
```

### Passo 2: Criar Processo com Primeira Versão

```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "artifact_ids": ["fake-id-1"],
    "process_name": "Processo de Teste",
    "project_id": "'$PROJECT_ID'"
  }'
```

Isso retornará um `process_id` e `model_version_id`. **Anote o `process_id`!**

### Passo 3: Criar Segunda Versão (com diferenças)

```bash
PROCESS_ID="id-retornado-no-passo-2"
VERSION_1_ID="id-da-versao-1"

curl -X POST http://localhost:8000/api/v1/processes/$PROCESS_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bpmn_json": {
      "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" targetNamespace=\"http://processlab.io\"><bpmn:process id=\"Process_1\" name=\"Processo Modificado\"><bpmn:startEvent id=\"StartEvent_1\"/><bpmn:userTask id=\"Task_1\" name=\"Nova Tarefa Adicionada\"/><bpmn:endEvent id=\"EndEvent_1\"/></bpmn:process></bpmn:definitions>"
    },
    "commit_message": "Added new user task",
    "change_type": "minor",
    "parent_version_id": "'$VERSION_1_ID'"
  }'
```

### Passo 4: Testar no Studio

1. Acesse: http://localhost:3000/studio?process_id=$PROCESS_ID
2. Clique na aba "History"
3. Clique em "Compare" em uma versão
4. Clique em "Compare" em outra versão
5. 🎉 O diff visual abrirá!

---

## Opção 2: Via UI do Studio

1. **Acesse o Studio**: http://localhost:3000/studio
2. **Carregue ou crie um processo** existente
3. **Faça alterações no diagrama** (adicionar/remover elementos)
4. **Salve como nova versão**:
   - Botão "Save New Version"
   - Preencha commit message
   - Escolha change type
   - Salve
5. **Repita** para criar mais versões
6. **Compare** usando a timeline

---

## Opção 3: Script Python de Teste

Crie um arquivo `test_diff_setup.py`:

```python
import requests
import json

API_URL = "http://localhost:8000"
TOKEN = "seu-token-jwt"  # Cole do localStorage

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 1. Criar processo
print("Criando processo...")
generate_res = requests.post(
    f"{API_URL}/api/v1/generate",
    headers=headers,
    json={
        "artifact_ids": ["test-1"],
        "process_name": "Test Process",
        "project_id": "seu-project-id"  # Substitua
    }
)
process_data = generate_res.json()
process_id = process_data["process_id"]
version_1_id = process_data["model_version_id"]

print(f"✅ Processo criado: {process_id}")
print(f"   Versão 1: {version_1_id}")

# 2. Criar versão 2 com diferenças
print("\nCriando versão 2...")
version_2_res = requests.post(
    f"{API_URL}/api/v1/processes/{process_id}/versions",
    headers=headers,
    json={
        "bpmn_json": {
            "xml": """<?xml version="1.0"?>
            <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
                <bpmn:process id="Process_1">
                    <bpmn:startEvent id="Start_1"/>
                    <bpmn:userTask id="Task_1" name="Nova Tarefa"/>
                    <bpmn:endEvent id="End_1"/>
                </bpmn:process>
            </bpmn:definitions>"""
        },
        "commit_message": "Added user task",
        "change_type": "minor",
        "parent_version_id": version_1_id
    }
)
version_2_data = version_2_res.json()
version_2_id = version_2_data["id"]

print(f"✅ Versão 2 criada: {version_2_id}")

print(f"\n🎉 Agora teste em: http://localhost:3000/studio?process_id={process_id}")
```

Execute:
```bash
python test_diff_setup.py
```

---

## ⚠️ Nota Importante sobre Artifact-ID

O código atual **aceita qualquer artifact-id** (não valida se existe). Ele usa:
- Texto hardcoded por padrão, OU
- Texto do `options.context_text` se fornecido

Então você pode usar qualquer string como artifact_id para teste:
- `"test-1"`
- `"fake-artifact"`
- Qualquer coisa!

O importante é que o `project_id` seja válido.

---

## 🔍 Verificar se Funcionou

1. Acesse o Studio com o process_id
2. Abra a aba "History"
3. Você deve ver pelo menos 2 versões
4. Clique em "Compare" → funcionará! ✅

---

## 💡 Dica

Se você já tem um processo existente, pode criar novas versões diretamente:

```bash
curl -X POST http://localhost:8000/api/v1/processes/SEU_PROCESS_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bpmn_json": {"xml": "SEU_XML_AQUI"},
    "commit_message": "Nova versão de teste",
    "change_type": "minor"
  }'
```

Repita com XMLs diferentes para criar múltiplas versões para comparar!

