# ProcessLab - Roadmap de Implementação

Este documento descreve o que ainda precisa ser implementado para alcançar o escopo final do ProcessLab, baseado na análise do código atual.

## 📊 Status Geral

### ✅ O que já está implementado:
1. **Landing Page** - Página inicial com botão "Open App" ✅
2. **Gerenciamento de Arquivos** - Estrutura básica completa:
   - Criação de folders e processos (+New)
   - Busca por nome (search)
   - Breadcrumb (parcial - precisa melhorias)
   - Sidebar com árvore do Private Space
   - Edição e deleção de folders
3. **Process Editor (BPMN Studio)** - Estrutura básica:
   - StudioNavbar com undo/redo, zoom, search, export, save, delete
   - FormatToolbar (com bugs conhecidos)
   - Canvas BPMN funcional
   - ProcessWizard básico (sem chat, sem API key, sem upload)

---

## 🎯 O que falta implementar

### (1) Landing Page
**Status:** ✅ **COMPLETO**
- Página simples da aplicação ✅
- Botão "Open App" que leva para `/spaces/private` ✅

---

### (2) Gerenciamento de Arquivos (Spaces/Folders/Process)

#### 2.1 Breadcrumb (Topo)
**Status:** ⚠️ **PARCIAL - PRECISA MELHORIAS**

- [x] Breadcrumb existe em `FolderBreadcrumbs` e `StudioNavbar`
- [ ] **MelhCorrigirorar breadcrumb no StudioNavbar:**
  - Atualmente mostra somente Private Space
  - Verificar se está sempre atualizado quando navega entre processos
  - Garantir que funciona corretamente para processos em folders aninhados profundos

#### 2.2 Folder - Funcionalidades
**Status:** ⚠️ **PARCIAL

- [x] Criar folders e processos (+New) ✅
- [x] Buscar (search) por nome de folder/process ✅
- [x] Editar nome + descrição ✅
- [x] Deletar folder (deleta folder e tudo dentro) ✅
- [ ] Retirar da página de folder botão de filtrar

#### 2.3 Sidebar (Esquerda)
**Status:** ✅ **COMPLETO**

- [x] Botão para voltar à landing page (`LogOut` icon que leva para `/`) ✅
- [x] Botão para minimizar a sidebar ✅
- [x] Busca global (process/folder) via `QuickSearch` ✅
- [x] Árvore do Private Space com folders e processos aninhados ✅

---

### (3) Process Editor (BPMN Studio)

#### 3.1 StudioNavbar
**Status:** ⚠️ **PARCIAL

- [x] Breadcrumb do processo ✅
- [x] Undo/redo ✅
- [x] Zoom ✅
- [x] Search elementos ✅
- [ ] Export - export de PDF e PNG não está funcionando
- [ ] Save - funcionaldiade não está funcionando
- [ ] Delete - não existe esse botão na UI

**Tarefas pendentes:**
- [ ] **Verificar e testar Export:**
  - Garantir que SVG/PNG/PDF generation está funcionando corretamente
  - Testar com diferentes tamanhos de diagrama
- [ ] **Verificar e testar Save:**
  - Confirmar que versioning API está recebendo XML e `changeType` corretamente
  - Testar salvamento de versões
- [ ] **Implementar botão de delete process**

#### 3.2 Toolbar (FormatToolbar)
**Status:** ⚠️ **FUNCIONAL COM BUGS CONHECIDOS**

- [x] Formatação de elementos (fonte, negrito, itálico, cor) ✅ (estrutura)
- [x] Botão para minimizar ProcessWizard ✅
- [ ] **BUG CRÍTICO - Funcionalidades não está sendo implementadas nos elementos**

#### 3.3 Canvas
**Status:** ✅ **COMPLETO**

- [x] Editor BPMN funcional ✅
- [x] Adição/edição de elementos ✅
- [x] Integração com bpmn-js ✅

#### 3.4 ProcessWizard
**Status:** ⚠️ **ESTRUTURA BÁSICA - PRECISA TRANSFORMAÇÃO COMPLETA**

**O que existe atualmente:**
- Interface básica com input de texto
- Envio de comandos para API `/api/v1/edit`
- Sugestões estáticas

**O que falta implementar:**

##### 3.4.1 Interface de Chat
- [ ] **Chat bubbles UI:**
  - [ ] Mensagens do usuário (lado direito, estilo user)
  - [ ] Mensagens da AI (lado esquerdo, estilo assistant)
  - [ ] Histórico de conversa persistente durante a sessão
  - [ ] Scroll automático para última mensagem
  - [ ] Indicador de typing quando AI está processando

- [ ] **Streaming responses:**
  - [ ] Implementar Server-Sent Events (SSE) ou WebSocket
  - [ ] Mostrar resposta da AI em tempo real (streaming)
  - [ ] Feedback visual durante geração

##### 3.4.2 Input de OpenAI API Key
- [ ] **Modal/Form para API Key:**
  - [ ] Campo de input para OpenAI API Key (tipo password)
  - [ ] Validação básica do formato da key
  - [ ] Armazenar temporariamente no estado (NUNCA no localStorage ou persistir)
  - [ ] Botão "Save" ou "Use Key"
  - [ ] Mostrar status se key está configurada/funcionando ou não
  - [ ] Opção para remover/limpar key

- [ ] **Integração com backend:**
  - [ ] Enviar API key no header das requisições para `/api/v1/edit`
  - [ ] Backend deve usar a key do header (BYOK pattern)
  - [ ] Nunca logar ou persistir a API key

##### 3.4.3 Upload de Arquivos (PDF e Imagens)
- [ ] **Interface de upload:**
  - [ ] Botão "Upload" ou drag-and-drop area
  - [ ] Suporte para PDF, PNG, JPG
  - [ ] Preview dos arquivos enviados
  - [ ] Lista de arquivos anexados à conversa
  - [ ] Opção para remover arquivos anexados

- [ ] **Backend integration:**
  - [ ] Endpoint para upload de arquivos (já existe `/api/v1/ingest/upload`)
  - [ ] Processar arquivos e extrair texto/imagens
  - [ ] Enviar conteúdo extraído junto com o comando para LLM
  - [ ] Suporte multimodal (texto + imagens) na API de edição

##### 3.4.4 Context Awareness
- [ ] **Melhorar awareness do contexto:**
  - [ ] Enviar XML atual do processo em cada requisição (já faz parcialmente)
  - [ ] Incluir histórico da conversa no contexto
  - [ ] Incluir arquivos anexados no contexto
  - [ ] Melhorar prompts para LLM entender o estado atual do BPMN

##### 3.4.5 Aplicação de Mudanças
- [ ] **Melhorar aplicação de mudanças:**
  - [ ] Garantir que mudanças retornadas pela API são aplicadas no canvas
  - [ ] Feedback visual quando mudanças são aplicadas
  - [ ] Opção para desfazer mudanças aplicadas pelo wizard
  - [ ] Preview antes de aplicar (opcional)

##### 3.4.6 Referência: bpmn-assistant
- [ ] **Estudar implementação:**
  - [ ] Revisar [bpmn-assistant](https://github.com/jtlicardo/bpmn-assistant)
  - [ ] Adaptar padrões de chat interface
  - [ ] Adaptar padrões de integração com LLM
  - [ ] **Diferença:** Adicionar suporte a PDF (bpmn-assistant não tem)

---

## 🔧 Tarefas Técnicas Adicionais

### Backend (API)
- [ ] **Endpoint de edição com suporte a arquivos:**
  - [ ] Modificar `/api/v1/edit` para aceitar:
    - `openai_api_key` (header)
    - `artifact_ids` (IDs de arquivos já enviados)
    - `command` (comando em linguagem natural)
    - `bpmn_xml` (XML atual)
  - [ ] Processar arquivos anexados e incluir no contexto do LLM
  - [ ] Suporte multimodal (texto + imagens de PDFs/imagens)

- [ ] **Streaming de respostas:**
  - [ ] Implementar SSE ou WebSocket para streaming
  - [ ] Endpoint `/api/v1/edit/stream` para respostas em tempo real

### Frontend
- [ ] **Gerenciamento de estado:**
  - [ ] Context ou state management para ProcessWizard
  - [ ] Persistir histórico de chat durante sessão (não persistir entre sessões)
  - [ ] Gerenciar API key temporariamente (não persistir)

- [ ] **Componentes:**
  - [ ] `ChatMessage` component (user/assistant bubbles)
  - [ ] `FileUpload` component (drag-and-drop)
  - [ ] `ApiKeyModal` component
  - [ ] `ChatInput` component melhorado

---

## 📋 Priorização Sugerida

### Fase 1: Correções Críticas (1-2 sprints)
0. 🟡 Remover botão filter da pagina de spaces e folder
1. 🟡 Breadcrumb improvements (verificação e testes)
2. 🟡 Export/Save verification
3. 🔴 **BUG: Text Formatting no Toolbar** (alta prioridade)

### Fase 2: ProcessWizard Core (2-3 sprints)
1. 🔴 **Interface de Chat** (chat bubbles, histórico)
2. 🔴 **Input de OpenAI API Key** (modal, validação, BYOK)
3. 🟡 **Streaming responses** (SSE/WebSocket)

### Fase 3: ProcessWizard Avançado (2 sprints)
1. 🟡 **Upload de arquivos** (PDF, imagens)
2. 🟡 **Context awareness melhorado**
3. 🟡 **Aplicação de mudanças melhorada**

### Fase 4: Polish & Testing (1 sprint)
1. 🟢 Testes end-to-end
2. 🟢 Melhorias de UX
3. 🟢 Documentação

---

## 📝 Notas de Implementação

### BYOK (Bring Your Own Key) Pattern
- **CRÍTICO:** API keys do usuário NUNCA devem ser:
  - Logadas
  - Persistidas no banco de dados
  - Armazenadas no localStorage
  - Enviadas em logs
- **Implementação:**
  - Armazenar apenas no estado React durante a sessão
  - Enviar no header `X-OpenAI-API-Key` nas requisições
  - Backend usa a key apenas para a requisição e descarta

### Referências
- **bpmn-assistant:** https://github.com/jtlicardo/bpmn-assistant
- **bpmn-js docs:** https://github.com/bpmn-io/bpmn-js
- **OpenAI API:** https://platform.openai.com/docs/api-reference
