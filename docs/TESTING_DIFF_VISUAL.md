# Guia de Teste - Diff Visual de Versões

Este guia explica como testar a funcionalidade de comparação visual entre versões BPMN que acabamos de implementar.

## 📋 Pré-requisitos

1. **Serviços rodando**: Backend (API), Frontend (Web), Banco de Dados, MinIO
2. **Usuário autenticado**: Você precisa estar logado no sistema
3. **Processo com múltiplas versões**: Pelo menos 2 versões do mesmo processo

---

## 🚀 Passo 1: Iniciar os Serviços

### Opção A: Docker Compose (Recomendado)

```bash
# Na raiz do projeto
make compose-up

# Aguardar alguns segundos para os serviços iniciarem
# Verificar status:
make compose-ps

# Ver logs se necessário:
make compose-logs
```

**URLs dos serviços:**
- 🌐 Frontend: http://localhost:3000
- 🔧 API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs
- 🗄️ Banco: localhost:5433

### Opção B: Serviços Locais

```bash
# Terminal 1: API
make api-dev

# Terminal 2: Frontend
make web-dev

# Terminal 3: Docker apenas para DB e MinIO
docker compose -f infra/compose/docker-compose.yml up db minio -d
```

---

## 🔐 Passo 2: Autenticação

1. Acesse http://localhost:3000
2. Se não tiver conta, registre-se em `/register`
3. Faça login em `/login`

**Nota**: Se for a primeira vez, o registro criará uma organização automaticamente.

---

## 📦 Passo 3: Preparar Dados de Teste

Você precisa de um processo com pelo menos 2 versões. Opções:

### Opção A: Criar Versões Manualmente (via Studio)

1. **Acesse o Studio**: http://localhost:3000/studio
2. **Crie ou carregue um processo** existente
3. **Faça alterações no diagrama** (adicionar/remover elementos)
4. **Salve como nova versão**:
   - Clique em "Save New Version"
   - Preencha mensagem de commit (ex: "Added user task")
   - Escolha tipo de mudança (major/minor/patch)
   - Clique em "Save Version"
5. **Repita** para criar mais versões

### Opção B: Usar API para Criar Versões de Teste

```bash
# 1. Obter token de autenticação (após fazer login)
TOKEN="seu-token-jwt-aqui"
PROCESS_ID="id-do-processo-aqui"

# 2. Criar primeira versão
curl -X POST http://localhost:8000/api/v1/processes/$PROCESS_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bpmn_json": {
      "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"><bpmn:process id=\"Process_1\" name=\"Test Process\"><bpmn:startEvent id=\"StartEvent_1\"/></bpmn:process></bpmn:definitions>"
    },
    "commit_message": "Initial version",
    "change_type": "major"
  }'

# 3. Criar segunda versão com diferenças
curl -X POST http://localhost:8000/api/v1/processes/$PROCESS_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bpmn_json": {
      "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?><bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"><bpmn:process id=\"Process_1\" name=\"Test Process\"><bpmn:startEvent id=\"StartEvent_1\"/><bpmn:userTask id=\"Task_1\" name=\"New Task\"/></bpmn:process></bpmn:definitions>"
    },
    "commit_message": "Added user task",
    "change_type": "minor",
    "parent_version_id": "id-da-versao-1"
  }'
```

---

## 🧪 Passo 4: Testar o Diff Visual

### 4.1. Acessar o Studio com Processo

1. Navegue até um processo que tenha múltiplas versões:
   - Via Dashboard → Projeto → Processo → Studio
   - Ou diretamente: http://localhost:3000/studio?process_id=SEU_PROCESS_ID

2. **Aguarde o carregamento** do processo e suas versões

### 4.2. Abrir Histórico de Versões

1. No painel direito do Studio, clique na aba **"History"**
2. Você verá a timeline com todas as versões do processo

### 4.3. Comparar Versões

1. **Clique no botão "Compare"** em uma versão (esta será a versão base)
2. O modo de comparação será ativado:
   - Você verá a mensagem: "Select a version to compare with vX"
   - O botão da versão base ficará destacado com "Base"
3. **Clique em "Compare"** em outra versão (versão a comparar)
4. O diff visual será aberto automaticamente!

### 4.4. Visualizar o Diff

O `VersionDiffViewer` abrirá em tela cheia mostrando:

- **Lado Esquerdo**: Versão base (vX)
- **Lado Direito**: Versão comparada (vY)
- **Legenda de cores**:
  - 🔴 Vermelho: Elementos removidos
  - 🟢 Verde: Elementos adicionados
  - 🟡 Amarelo: Elementos modificados
- **Informações das versões**: número, mensagem de commit, data

### 4.5. Verificar Funcionalidades

- ✅ **Fechar o diff**: Clique em "✕ Close" no canto superior direito
- ✅ **Scroll e zoom**: Funciona normalmente nos diagramas
- ✅ **Loading**: Deve mostrar spinner enquanto carrega
- ✅ **Erros**: Se houver problema, mostra mensagem de erro

---

## ✅ Checklist de Teste

### Funcionalidades Básicas
- [ ] Timeline de versões carrega corretamente
- [ ] Botão "Compare" aparece em cada versão
- [ ] Modo de comparação é ativado ao clicar em "Compare"
- [ ] Versão base é destacada corretamente
- [ ] Botão "Cancel" funciona
- [ ] Diff viewer abre quando duas versões são selecionadas

### Visualização
- [ ] Dois diagramas aparecem lado a lado
- [ ] Highlights de cores funcionam (vermelho/verde/amarelo)
- [ ] Legenda está visível e clara
- [ ] Informações das versões estão corretas
- [ ] Loading state aparece durante carregamento

### Navegação
- [ ] Fechar o diff retorna para o Studio
- [ ] Não há erros no console do navegador
- [ ] Performance aceitável (carregamento rápido)

### Casos Especiais
- [ ] Comparar mesma versão consigo mesma (deve prevenir ou mostrar sem diferenças)
- [ ] Comparar versões muito diferentes (muitas mudanças)
- [ ] Versões sem XML válido (deve tratar erro graciosamente)

---

## 🐛 Troubleshooting

### Problema: "Failed to load versions"
- **Causa**: Token de autenticação inválido ou expirado
- **Solução**: Faça logout e login novamente

### Problema: "Failed to load diff viewer"
- **Causa**: XML inválido ou erro no bpmn-js-differ
- **Solução**: 
  1. Verifique console do navegador para detalhes
  2. Verifique se as versões têm XML válido
  3. Tente com versões mais simples primeiro

### Problema: Diff não mostra highlights
- **Causa**: bpmn-js-differ pode não ter encontrado diferenças semânticas
- **Solução**: 
  1. Verifique se realmente há diferenças entre as versões
  2. Tente versões com mudanças mais evidentes (adicionar/remover tarefas)

### Problema: Serviços não iniciam
- **Causa**: Portas em uso ou Docker não está rodando
- **Solução**:
  ```bash
  # Verificar portas
  lsof -i :3000
  lsof -i :8000
  
  # Parar serviços anteriores
  make compose-down
  
  # Reiniciar
  make compose-up
  ```

---

## 📸 Screenshots Esperados

1. **Timeline com botão Compare**: Cada versão tem um botão "Compare"
2. **Modo de comparação ativo**: Uma versão destacada como "Base"
3. **Diff Viewer aberto**: Dois diagramas lado a lado com highlights

---

## 🔗 Links Úteis

- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Frontend: http://localhost:3000
- Logs: `make compose-logs` ou `make compose-logs-api`

---

## 💡 Dicas

1. **Use versões simples primeiro**: Comece com mudanças pequenas e fáceis de identificar
2. **Verifique o console**: Abra DevTools (F12) para ver logs e erros
3. **Teste com diferentes navegadores**: Chrome, Firefox, Safari
4. **Performance**: Se estiver lento, verifique tamanho dos XMLs (versões muito complexas)

---

**Boa sorte com os testes! 🚀**

Se encontrar problemas ou tiver sugestões, documente para melhorias futuras.

