# ProcessLab - Arquitetura de Código

## 1. Visão Geral

Monorepo (`processlab/`) com três pilares:
- **apps/api**: FastAPI (Python) - ingestão, geração/edição/exportação de BPMN, RAG, versionamento, auditoria.
- **apps/web**: Next.js (TypeScript/React) - editor BPMN (bpmn-js), copilot, catálogo de processos.
- **packages/shared-schemas**: Fonte de verdade do `BPMN_JSON` (schema JSON + tipos TS + modelos Pydantic).

**Princípio fundamental**: JSON é a fonte de verdade; XML é usado apenas em bordas (import/export/visualização).

---

## 2. Estrutura Atual

### 2.1. Backend (`apps/api`)

#### Estrutura de Diretórios
```
apps/api/
├── app/
│   ├── main.py                    # Instância FastAPI, middlewares, rotas
│   ├── api/v1/
│   │   ├── router.py              # Agregação de rotas
│   │   ├── generate.py            # POST /generate - geração de processos
│   │   ├── edit.py                # POST /edit - edição via NL
│   │   ├── export.py              # POST /export - exportação XML/PNG/JSON
│   │   ├── search.py              # POST /search - busca semântica
│   │   └── endpoints/
│   │       ├── auth.py            # Autenticação (register, login, me)
│   │       ├── organizations.py   # CRUD organizações
│   │       ├── projects.py        # CRUD projetos
│   │       ├── processes.py      # CRUD processos + versionamento
│   │       ├── folders.py         # CRUD pastas + hierarquia
│   │       ├── users.py           # Endpoints pessoais (/me/*)
│   │       ├── shares.py          # Compartilhamento de projetos
│   │       ├── ingestion.py       # Upload de artefatos
│   │       ├── invitations.py     # Convites para organizações
│   │       ├── api_keys.py        # Gerenciamento de API keys (BYOK)
│   │       └── audit_log.py        # Logs de auditoria
│   ├── services/
│   │   ├── agents/
│   │   │   ├── pipeline.py        # Orquestração de geração
│   │   │   ├── synthesis.py       # Síntese de BPMN_JSON
│   │   │   ├── linter.py          # Regras de validação BPMN
│   │   │   ├── layout.py          # Layout automático (stub)
│   │   │   └── supervisor.py      # Telemetria e métricas
│   │   ├── bpmn/
│   │   │   ├── json_to_xml.py     # Conversão BPMN_JSON → XML
│   │   │   ├── xml_to_json.py     # Conversão XML → BPMN_JSON
│   │   │   ├── patch.py            # Aplicação de patches
│   │   │   └── layout.py          # Layout (fallback frontend)
│   │   ├── ingestion/
│   │   │   ├── pipeline.py        # Pipeline de ingestão
│   │   │   ├── factory.py         # Factory por tipo de arquivo
│   │   │   ├── text.py            # Processamento de texto
│   │   │   ├── pdf.py             # Processamento de PDF
│   │   │   ├── docx.py            # Processamento de DOCX
│   │   │   ├── ocr.py             # OCR de imagens
│   │   │   └── chunking.py        # Chunking inteligente
│   │   ├── rag/
│   │   │   ├── embeddings.py      # Geração de embeddings
│   │   │   ├── retriever.py       # Busca semântica (pgvector)
│   │   │   └── indexer.py         # Indexação de chunks
│   │   ├── storage/
│   │   │   └── minio.py           # Cliente MinIO/S3
│   │   └── vector/
│   │       └── embeddings.py      # Utilitários de embeddings
│   ├── db/
│   │   ├── models.py              # Modelos SQLAlchemy
│   │   └── session.py             # Sessão de DB
│   ├── schemas/
│   │   ├── auth.py                # Schemas de autenticação
│   │   ├── versioning.py          # Schemas de versionamento
│   │   ├── governance.py          # Schemas de governança
│   │   └── hierarchy.py          # Schemas de hierarquia
│   ├── core/
│   │   ├── auth.py                # JWT, hash de senhas
│   │   ├── config.py              # Configurações
│   │   ├── dependencies.py        # Dependências FastAPI (get_current_user, etc.)
│   │   ├── exceptions.py          # Exceções customizadas
│   │   ├── logging_config.py     # Configuração de logs
│   │   ├── middleware.py          # Middlewares (request_id, etc.)
│   │   └── security.py           # Utilitários de segurança
│   └── workers/
│       └── tasks.py               # Tarefas Celery (ingest_artifact_task)
├── alembic/                       # Migrações de banco
└── tests/                         # Testes unitários e integração
```

#### Modelos de Dados (`app/db/models.py`)
- **Organization**: Multi-tenancy, isolamento por organização
- **User**: Usuários com roles (viewer, editor, admin)
- **Project**: Projetos (org ou pessoais), com `is_default` para "Drafts"
- **Folder**: Hierarquia de pastas (Project → Folder → Subfolder → Process)
- **ProcessModel**: Processos BPMN, referência a `current_version_id`
- **ModelVersion**: Versões com `bpmn_json`, `etag` (optimistic locking), `parent_version_id`
- **Artifact**: Artefatos uploadados (MinIO/S3)
- **EmbeddingChunk**: Chunks RAG com embeddings (pgvector)
- **ModelVersionArtifact**: Associação versão ↔ artefato
- **AuditEntry**: Trilha de auditoria
- **ProjectShare**: Compartilhamento de projetos pessoais
- **Invitation**: Convites para organizações
- **ApiKey**: API keys (BYOK para LLM, integrações)
- **SystemAuditLog**: Logs de auditoria do sistema

#### Endpoints Principais
- **Autenticação**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`
- **Organizações**: `/api/v1/organizations/*`
- **Projetos**: `/api/v1/projects/*`
- **Processos**: `/api/v1/processes/*`, `/api/v1/processes/{id}/versions/*`
- **Pastas**: `/api/v1/projects/{id}/folders/*`, `/api/v1/projects/{id}/hierarchy`
- **Versionamento**: criar, listar, ativar, restaurar, diff (textual)
- **Geração**: `/api/v1/generate` (POST)
- **Edição**: `/api/v1/edit` (POST)
- **Exportação**: `/api/v1/export` (POST)
- **Busca**: `/api/v1/search` (POST)
- **Ingestão**: `/api/v1/ingest/upload` (POST)
- **Governança**: `/api/v1/invitations/*`, `/api/v1/api-keys/*`, `/api/v1/audit-log/*`

### 2.2. Frontend (`apps/web`)

#### Estrutura de Diretórios
```
apps/web/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx               # Landing page
│   │   ├── login/                 # Login
│   │   ├── register/              # Registro
│   │   ├── invite/[token]/        # Aceite de convite
│   │   ├── dashboard/             # Redirect para workspace
│   │   ├── w/[orgSlug]/           # Workspace organizacional
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── projects/         # Catálogo de projetos
│   │   │   ├── folders/[id]/     # Visualização de pasta
│   │   │   ├── studio/            # Editor BPMN
│   │   │   └── settings/         # Configurações (members, api-keys, audit-log)
│   │   ├── personal/              # Workspace pessoal
│   │   │   ├── page.tsx          # Dashboard pessoal
│   │   │   ├── projects/         # Projetos pessoais
│   │   │   ├── folders/[id]/     # Visualização de pasta
│   │   │   └── studio/           # Editor BPMN
│   │   ├── share/[token]/        # Links de compartilhamento
│   │   ├── forbidden/            # 403
│   │   └── not-found.tsx         # 404
│   ├── features/
│   │   ├── bpmn/
│   │   │   ├── editor/
│   │   │   │   ├── BpmnEditor.tsx        # Editor bpmn-js
│   │   │   │   └── custom/               # Customizações bpmn-js
│   │   │   ├── layout/                    # Auto-layout (ELK.js)
│   │   │   ├── linting/                  # Validação BPMN
│   │   │   ├── io/                       # Conversão JSON ↔ XML
│   │   │   ├── sync/                     # Sincronização com API
│   │   │   ├── ElementsSidebar.tsx        # Sidebar de elementos
│   │   │   └── StudioContent.tsx         # Container principal do Studio
│   │   ├── versioning/
│   │   │   ├── VersionTimeline.tsx       # Timeline de versões
│   │   │   ├── VersionDiffViewer.tsx     # Diff visual (bpmn-js-differ)
│   │   │   ├── SaveVersionModal.tsx      # Modal de salvar versão
│   │   │   ├── RestoreVersionModal.tsx   # Modal de restaurar versão
│   │   │   └── ConflictModal.tsx         # Modal de conflito (optimistic locking)
│   │   ├── copiloto/
│   │   │   └── Copilot.tsx               # Chat de edição (NL → /api/v1/edit)
│   │   ├── citations/
│   │   │   └── Citations.tsx             # Placeholder de citações
│   │   └── projects/
│   │       └── ProjectHierarchy.tsx     # Árvore de hierarquia (drag-and-drop)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx             # Layout principal
│   │   │   ├── Navbar.tsx                # Navbar
│   │   │   ├── StudioNavbar.tsx          # Navbar do Studio
│   │   │   ├── WorkspaceLayout.tsx       # Layout de workspace
│   │   │   ├── WorkspaceSwitcher.tsx     # Seletor de workspace
│   │   │   └── UserProfile.tsx           # Perfil do usuário
│   │   ├── ui/                           # Componentes UI (shadcn/ui)
│   │   │   ├── breadcrumbs.tsx           # Breadcrumbs
│   │   │   └── ...                      # Outros componentes
│   │   ├── branding/                     # Componentes de marca
│   │   └── illustrations/                 # Ilustrações
│   ├── contexts/
│   │   ├── AuthContext.tsx               # Contexto de autenticação
│   │   └── WorkspaceContext.tsx          # Contexto de workspace
│   └── lib/
│       └── utils.ts                      # Utilitários
├── public/                               # Assets estáticos
└── package.json                          # Dependências (Next.js 16, React 19, TailwindCSS v4)
```

#### Tecnologias Principais
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **TailwindCSS v4**
- **bpmn-js** (editor BPMN)
- **ELK.js** (auto-layout)
- **bpmn-js-differ** (diff visual)

### 2.3. Shared Schemas (`packages/shared-schemas`)

```
packages/shared-schemas/
├── src/
│   ├── bpmn_json.schema.json      # Schema JSON principal (fonte de verdade)
│   ├── bpmn_patch.schema.json     # Schema de patches
│   ├── types.ts                   # Tipos TypeScript gerados
│   └── models.py                  # Modelos Pydantic gerados
└── package.json
```

**Geração**: Alterar `bpmn_json.schema.json` → executar `pnpm run generate` → tipos TS e modelos Pydantic atualizados.

---

## 3. Estrutura Prevista

### 3.1. Backend (`apps/api`)

#### Novos Endpoints (`app/api/v1/endpoints/`)
- **`review.py`**: Fluxo de aprovação (criar proposta, revisar, aprovar, promover)
- **`comments.py`**: Comentários ancorados em elementos/versões, threads
- **`evidence.py`**: Vincular evidências a versões/elementos, export de rastreabilidade
- **`reports.py`**: Geração de POPs, resumos executivos, relatórios de conformidade
- **`integrations.py`**: Webhooks, conectores externos (Jira/ServiceNow/ERP/CRM)

#### Novos Services (`app/services/`)
- **`notifications/`**: Email, Slack/Teams, webhooks para mudanças
- **`reports/`**: Geração de relatórios automáticos (POPs, manuais, conformidade)
- **`integrations/`**: Conectores Jira/ServiceNow/ERP/CRM, webhooks
- **`auth/`**: SSO (SAML/OIDC), RBAC avançado

#### Novos Modelos (`app/db/models.py`)
- **`Comment`**: Comentários ancorados em elementos/versões
- **`ReviewRequest`**: Propostas de mudança, workflow de aprovação
- **`Role`**: Papéis granulares (viewer, editor, reviewer, approver, admin)
- **`Integration`**: Configurações de integrações externas
- **`Evidence`**: Evidências vinculadas a versões/elementos (com referências a artefatos/chunks)

### 3.2. Frontend (`apps/web`)

#### Novas Features (`src/features/`)
- **`catalog/`**: Catálogo de processos com filtros avançados (status, área, dono, projeto, risco)
- **`collaboration/`**: Comentários inline no diagrama, threads, resolução
- **`approval/`**: Fluxo de review/approval, lista de mudanças pendentes
- **`evidence/`**: Visualização de evidências por versão/elemento, rastreabilidade

#### Design System (`src/design-system/`)
- **Tokens**: Cores, tipografia, espaçamento, sombras, bordas
- **Componentes Base**: Botões, inputs, modais, toasts, cards, tabelas, filtros
- **Temas**: Suporte a temas customizáveis por organização, modo claro/escuro

#### Componentes UI (`src/components/ui/`)
- Expansão dos componentes do design system (shadcn/ui)
- Componentes específicos: comentários inline, timeline de aprovação, visualizador de evidências

### 3.3. Shared (`packages/`)

#### Novo Pacote
- **`packages/prompts/`**: Prompts versionados para IA, orquestração (LangGraph futuro)

---

## 4. Decisões de Arquitetura Fundamentais

### 4.1. Representação de Dados
- **JSON-first**: `BPMN_JSON` é a representação interna. XML apenas em bordas (import/export/visualização).
- **Schema único**: `packages/shared-schemas` é fonte de verdade; geração automática de tipos TS e modelos Pydantic.

### 4.2. Editor e Layout
- **Editor plugável**: bpmn.io como motor de desenho; contrato de entrada/saída é `BPMN_JSON` + eventos de patch. Facilita troca futura do motor.
- **Layout**: ELK.js no frontend (atual); backend layout opcional servidor (futuro).

### 4.3. IA e RAG
- **RAG e IA**: Operar sobre JSON e patch ops; nunca acoplar à UI. Registrar evidências usadas (artefatos, trechos) em cada versão.
- **Grounding obrigatório**: Citações em `meta` dos elementos, evidências por versão (Fase 4).

### 4.4. Versionamento
- **Versionamento**: Cada alteração gera `ModelVersion` com diffs, autor, mensagem de commit; fluxo de aprovação promove versões.
- **Optimistic locking**: `etag` (SHA256) para detecção de conflitos.

### 4.5. Segurança e Multi-tenancy
- **BYOK**: Chaves de LLM nunca logadas/persistidas; escopo por organização; logging sem dados sensíveis.
- **Multi-tenancy**: Isolamento por `organization_id` em todas as tabelas principais; Row Level Security (Fase 2+).
- **RBAC**: Papéis (viewer, editor, reviewer, approver, admin) com permissões granulares (Fase 3+).

### 4.6. Infraestrutura
- **Filas**: Celery/Redis para ingest/IA pesada, jobs assíncronos.
- **Storage**: MinIO/S3 para artefatos, transcrições, evidências.
- **DB**: Postgres + pgvector para embeddings.

---

## 5. Gap Analysis: Atual vs Prevista

### 5.1. Backend

#### Implementado ✅
- Estrutura base de API (FastAPI, rotas, middlewares)
- Modelos de dados: Organization, User, Project, Folder, ProcessModel, ModelVersion, Artifact, EmbeddingChunk
- Endpoints: auth, organizations, projects, processes, folders, versionamento básico
- Services: agents (pipeline, synthesis, linter), bpmn (conversores, patch), ingestion (básico), rag (básico)
- Governança: invitations, api-keys, audit-log
- Compartilhamento: ProjectShare

#### Previsto ❌
- **Colaboração**: `review.py`, `comments.py` (comentários ancorados, workflow de aprovação)
- **Rastreabilidade**: `evidence.py` (vincular evidências a versões/elementos)
- **Relatórios**: `reports.py` (POPs, resumos, conformidade)
- **Integrações**: `integrations.py` (webhooks, conectores externos)
- **Services**: `notifications/`, `reports/`, `integrations/`, `auth/` (SSO)
- **Modelos**: Comment, ReviewRequest, Role, Integration, Evidence

### 5.2. Frontend

#### Implementado ✅
- Estrutura base (Next.js App Router)
- Features: bpmn (editor, layout, linting, sync), versioning (timeline, diff visual, modais), copilot
- Rotas: workspace organizacional, pessoal, compartilhamento
- Componentes: layout (AppLayout, Navbar, WorkspaceLayout), UI básicos (breadcrumbs)
- Contextos: AuthContext, WorkspaceContext

#### Previsto ❌
- **Features**: `catalog/` (catálogo com filtros), `collaboration/` (comentários inline), `approval/` (review/approval), `evidence/` (visualização de evidências)
- **Design System**: `design-system/` (tokens, componentes base, temas)
- **Componentes UI**: Expansão completa do design system

### 5.3. Shared

#### Implementado ✅
- `packages/shared-schemas`: Schema BPMN_JSON, tipos TS, modelos Pydantic

#### Previsto ❌
- `packages/prompts/`: Prompts versionados para IA, orquestração (LangGraph)

---

## 6. Hierarquia de Dados

### Estrutura Atual
```
Organization
  └── Project (org projects)
      └── Folder (hierárquico, opcional)
          └── ProcessModel
              └── ModelVersion (múltiplas versões)
                  └── ModelVersionArtifact (associação)

User
  └── Project (personal projects, organization_id = NULL)
      └── Folder (hierárquico, opcional)
          └── ProcessModel
              └── ModelVersion
                  └── ModelVersionArtifact

Artifact
  └── EmbeddingChunk (múltiplos chunks)
```

### Estrutura Prevista (Fase 3+)
```
Organization
  └── Project
      └── Folder
          └── ProcessModel
              └── ModelVersion
                  ├── ModelVersionArtifact
                  ├── Comment (ancorado em elemento/versão)
                  ├── Evidence (vinculado a versão/elemento)
                  └── ReviewRequest (proposta de mudança)
                      └── Comment (threads de revisão)
```
