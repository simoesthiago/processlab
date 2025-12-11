# ProcessLab - PRD

## 1. Visão e Objetivo
- **Produto**: Plataforma SaaS de modelagem de processos com editor BPMN e copilot de IA generativa
- **Problema**: Consultorias e áreas internas de mapeamento de processos precisam de uma ferramenta moderna para criar, organizar e gerenciar processos de negócio com apoio de IA
- **Objetivo**: Permitir que usuários modelem processos BPMN de forma eficiente usando IA generativa, organizando-os em workspaces, folders e processos de forma intuitiva

## 2. Público-Alvo
- **Consultor**: cria/edita modelos de processos, usa IA para rascunhos rápidos, precisa de produtividade
- **Analista de Processos**: mantém processos organizados, cria novos processos a partir de documentos, exporta para apresentações
- **Usuário de Negócio**: consome processos modelados, precisa visualizar e entender fluxos

## 3. Métricas de Sucesso (inicial)
- Tempo médio para gerar rascunho de processo a partir de insumos (P95 < 60s)
- Adoção: processos criados por usuário, usuários ativos semanais
- Qualidade: taxa de lint OK em BPMN, satisfação com geração de IA
- Organização: processos organizados em folders, uso de workspaces

## 4. Escopo Funcional

### Core (Foco Principal)

#### 1. Armazenamento e Gestão de Processos
- **Workspace (Organization/Personal)**: Espaços de trabalho organizacionais ou pessoais
  - Organizações: múltiplos usuários, projetos compartilhados
  - Espaço Pessoal: projetos privados do usuário
- **Project**: Agrupa processos relacionados dentro de um workspace
  - Projetos organizacionais: compartilhados entre membros
  - Projetos pessoais: privados do usuário
- **Folder**: Organização hierárquica de processos dentro de projetos
  - Estrutura de pastas aninhadas (subfolders)
  - Ordenação por posição
  - Metadados opcionais (cor, ícone)
- **Process**: Modelo de processo BPMN
  - Pertence a um Project (e opcionalmente a um Folder)
  - Múltiplas versões (histórico básico)
  - Metadados: nome, descrição, tags

**Hierarquia**: `Workspace → Project → Folder (opcional, hierárquico) → Process → Version`

#### 2. Studio/Canvas para Criação e Edição
- **Editor BPMN**: Editor visual baseado em bpmn.io
  - Edição em formato interno `BPMN_JSON`
  - Conversão para XML apenas em import/export
  - Operações: adicionar/editar/remover nós e fluxos
  - Auto-layout (ELK.js) para organização automática
  - Alinhamento e distribuição de elementos
- **IA Generativa**: Copilot para auxiliar na criação
  - Geração de processos a partir de texto/documentos
  - Edição conversacional ("adicionar etapa de aprovação")
  - Ingestão de documentos (PDF, DOCX, TXT) com RAG básico
  - Sugestões inteligentes durante edição
- **Versionamento Básico**: Salvar versões anteriores
  - Criar nova versão com mensagem de commit
  - Histórico de versões (lista simples)
  - Ativar/restaurar versão anterior
  - **NÃO inclui**: diff visual, branches, merge, aprovação
- **Export/Download**: Múltiplos formatos
  - XML BPMN 2.0
  - PNG/PDF do diagrama
  - JSON interno
- **Save**: Salvar processo no workspace/folder/project atual

### Funcionalidades Secundárias

- **Autenticação**: Login/Register, JWT, isolamento por organização
- **Busca**: Busca simples por nome/descrição de processos
- **Lint Básico**: Validação de regras BPMN básicas

### Funcionalidades Removidas (Não no Escopo)

- ❌ Fluxo de aprovação/review
- ❌ Diff visual entre versões
- ❌ Audit log completo do sistema
- ❌ Sistema de convites complexo
- ❌ Gestão de API Keys
- ❌ Comentários ancorados
- ❌ Rastreabilidade complexa (evidências vinculadas)
- ❌ Relatórios automáticos
- ❌ Integrações enterprise (Jira, ServiceNow, etc.)
- ❌ SSO/RBAC avançado
- ❌ Notificações (email/Slack/Teams)

## 5. Requisitos Funcionais

### 1. Hierarquia Workspace/Folder/Process
- Criar/editar/deletar workspaces (organizações)
- Criar/editar/deletar projetos dentro de workspaces
- Criar/editar/deletar folders hierárquicos dentro de projetos
- Criar/editar/deletar processos dentro de folders ou diretamente em projetos
- Navegação fluida: Workspace → Project → Folder → Process → Studio
- Visualização em árvore da hierarquia

### 2. Studio/Canvas
- Abrir processo no editor BPMN
- Editar elementos (tasks, gateways, events, flows)
- Auto-layout automático
- Salvar processo (cria nova versão)
- Carregar versão anterior
- Exportar em múltiplos formatos (XML, PNG, PDF, JSON)

### 3. IA Generativa
- Ingestão de documentos (PDF, DOCX, TXT)
- Geração de processo a partir de texto/documentos
- Edição conversacional ("adicionar etapa X após Y")
- RAG básico para contexto dos documentos
- Lint pós-edição (validação BPMN básica)

### 4. Versionamento Básico
- Criar nova versão com mensagem de commit
- Listar histórico de versões
- Ativar/restaurar versão anterior
- **NÃO inclui**: diff visual, comparação lado a lado, branches

### 5. Autenticação e Acesso
- Login/Register
- JWT tokens
- Isolamento por organização
- Acesso a projetos pessoais e organizacionais

## 6. Requisitos Não Funcionais

- **Segurança**: JWT, isolamento por organização, CORS configurável
- **Performance**: Geração de processo P95 < 60s, UI responsiva, layout automático em segundos
- **Escalabilidade**: Suporte a múltiplas organizações, filas para ingest/IA, pooling de DB
- **Confiabilidade**: Health checks, timeouts e retries, graceful degradation (fallback de IA)
- **Observabilidade**: Logs estruturados (JSON), `request_id`, métricas básicas
- **Usabilidade**: Interface intuitiva, navegação clara, feedback visual

## 7. Arquitetura de Referência

- **Monorepo**: `apps/api` (FastAPI), `apps/web` (Next.js 16 / React 19 + bpmn.io), `packages/shared-schemas` (BPMN_JSON schema/types/models)
- **Fonte de verdade**: `BPMN_JSON` (`packages/shared-schemas/src/bpmn_json.schema.json`); tipos gerados TS/Pydantic
- **Editor**: bpmn-js como motor; ELK para layout; UI React/Next
- **Backend**:
  - API: ingest/generate/edit/export; versionamento básico; hierarquia (workspace/folder/process)
  - Services: agents (synthesis, linter, layout), bpmn converters, RAG (retriever/indexer/embeddings), ingestion (docx/pdf), workers (Celery)
  - DB: Postgres + pgvector para embeddings
  - Storage: MinIO para artefatos
- **IA/RAG**: embeddings + retriever; prompts centralizados

## 8. Roadmap Simplificado

- **Fase 1 (MVP)**: Editor BPMN + IA básica + Hierarquia básica + Versionamento simples
- **Fase 2 (Polimento)**: Melhorias na hierarquia, IA mais robusta, export avançado, UX refinada
- **Fase 3 (Escala)**: Performance, observabilidade, melhorias de IA

## 9. Dependências e Restrições

- Basear editor em bpmn.io inicialmente; manter contrato JSON para eventual troca
- Manter schema único; proibido tipos divergentes
- Sujeito a limites de custo/uso de LLMs
- Garantir encoding/accentuação correta em docs/código

## 10. Riscos e Mitigações

- **Alucinação da IA**: Lint pós-edição, validação de estrutura BPMN
- **Escala de ingestão/IA**: Usar filas/workers; limites de tamanho (30MB por upload)
- **Segurança multi-tenant**: Isolar dados por organização; testes de permissão
- **Adoção do usuário**: UX intuitiva, onboarding claro, feedback visual

## 11. Critérios de Aceite (MVP)

- Criar/abrir processos por workspace/project/folder
- Gerar rascunho via IA a partir de pelo menos um documento
- Editar com copilot conversacional
- Salvar versão e restaurar versão anterior
- Exportar XML e JSON interno
- Lint básico sem erros críticos
- Navegação fluida na hierarquia workspace/folder/process
- Autenticação básica e isolamento por organização
