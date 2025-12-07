# ProcessLab - Arquitetura de Codigo

## 1. Visao Geral
Monorepo (`processlab/`) com tres pilares:
- **apps/api**: FastAPI (Python) - ingestao, geracao/edicao/exportacao de BPMN, RAG, versionamento, auditoria.
- **apps/web**: Next.js (TypeScript/React) - editor BPMN (bpmn-js), copilot, catalogo de processos.
- **packages/shared-schemas**: Fonte de verdade do `BPMN_JSON` (schema JSON + tipos TS + modelos Pydantic).

JSON e a fonte de verdade; XML e usado apenas em bordas (import/export/visualizacao).

## 2. Estrutura do Repositorio (Atual + Prevista)

### Estrutura Atual
- `apps/api`
  - `app/main.py`: instancia FastAPI, CORS/TrustedHost, inclui rotas `/api/v1`.
  - `app/api/v1/`: endpoints `generate`, `edit`, `export`, `search` + `endpoints/ingestion`.
  - `app/services/`:
    - `agents/`: `pipeline.py` (orquestra geracao), `synthesis.py` (heuristica), `linter.py` (regras BPMN), `layout.py` (stub), `supervisor.py` (telemetria).
    - `bpmn/`: `json_to_xml.py`, `xml_to_json.py`, `patch.py` (aplica patches), `layout.py` (frontend fallback).
    - `ingestion/`: docx/pdf/text/ocr chunking/pipeline (stubs em evolucao).
    - `rag/`: embeddings, retriever, indexer (usa pgvector).
    - `storage/`, `vector/`: infra de suporte (placeholders).
  - `app/db/`: `models.py` (ProcessModel, ModelVersion, Artifact, EmbeddingChunk, AuditEntry, User, Organization, Project), `session.py`.
  - `app/workers/`: Celery tasks (`ingest_artifact_task`).
  - `tests/`: cobertura basica de generate/edit/lint/health.
- `apps/web`
  - `src/features/bpmn/`: `editor/BpmnEditor.tsx` (bpmn-js + ELK), `layout`, `linting`, `io`, `sync`.
  - `src/features/copiloto/Copilot.tsx`: chat de edicao chamando `/api/v1/edit`.
  - `src/features/citations/`: placeholder.
  - `src/features/versioning/`: `VersionDiffViewer.tsx` (diff visual), timeline de versões.
  - `src/app/`: rotas Next.js (App Router).
    - `w/[orgSlug]/`: rotas de workspace (dashboard, projects, studio).
    - `personal/`: rotas pessoais do usuário.
    - `(auth)/`: login, register, invite.
  - `src/components/`: componentes reutilizáveis (UI, Layout, Branding).
  - `src/contexts/`: AuthContext, WorkspaceContext.
  - Config: Next.js 16, React 19, TailwindCSS v4, ESLint.
- `packages/shared-schemas`
  - `src/bpmn_json.schema.json`: schema principal.
  - `src/types.ts`: tipos TS gerados.
  - `src/models.py`: modelos Pydantic gerados.
- `infra/compose/docker-compose.yml`: stack local (api, web, worker, db pgvector, minio, redis).
- `docs/`: PRD, roadmap, rules (dev/security), este code_architecture.

### Estrutura Prevista (Fases Futuras)
- `apps/api`
  - `app/api/v1/endpoints/`:
    - `processes.py`: CRUD, catálogo, busca semântica.
    - `versions.py`: criar/ativar, histórico, diff, branches.
    - `review.py`: proposta, revisão, aprovação.
    - `comments.py`: comentários ancorados, threads.
    - `evidence.py`: vincular evidências, export de rastreabilidade.
    - `reports.py`: geração de POPs, resumos, conformidade.
    - `integrations.py`: webhooks, conectores externos.
  - `app/services/`:
    - `notifications/`: email, Slack/Teams, webhooks.
    - `reports/`: geração de relatórios automáticos.
    - `integrations/`: conectores Jira/ServiceNow/ERP/CRM.
    - `auth/`: SSO (SAML/OIDC), RBAC avançado.
  - `app/db/models.py`: adicionar `Comment`, `ReviewRequest`, `Role`, `Integration`, etc.
- `apps/web`
  - `src/features/catalog/`: catálogo de processos, filtros, busca.
  - `src/features/collaboration/`: comentários inline, threads.
  - `src/features/approval/`: fluxo de review/approval.
  - `src/features/evidence/`: visualização de evidências.
  - `src/design-system/`: tokens, componentes base, temas (Sprint 2.5).
  - `src/components/ui/`: componentes do design system (botões, inputs, modais, etc.).
- `packages/prompts/`: prompts versionados para IA (futuro).

## 3. Fluxos Principais

### Fluxos Atuais (Implementados)
#### Geracao (API)
1. `POST /api/v1/generate`: recebe `artifact_ids`, `process_name`.
2. `agents/pipeline.generate_process`: recupera contexto (stub), sintetiza BPMN_JSON, lint, converte para XML, layout (stub), retorna metricas.
3. Persiste `ProcessModel` e `ModelVersion`, vincula `ModelVersionArtifact`.

#### Edicao (API)
1. `POST /api/v1/edit`: recebe comando NL + BPMN_JSON/XML ou `model_version_id`.
2. Interpreta comando (regex), resolve nomes->IDs, aplica patch (`BpmnPatchService`), lint, cria nova `ModelVersion`, registra `AuditEntry`.

#### Ingestao (API)
1. `POST /api/v1/ingest/upload`: upload para MinIO, cria `Artifact`, dispara `ingest_artifact_task`.
2. Pipeline de ingestao (stubs): chunking + embeddings -> `EmbeddingChunk`.

#### Export (API)
1. `POST /api/v1/export`: converte BPMN_JSON -> XML (real), PNG (stub), JSON (base64).

#### Versionamento (API)
1. `POST /api/v1/versions`: cria nova versão com mensagem de commit.
2. `GET /api/v1/versions`: lista histórico de versões.
3. `PUT /api/v1/versions/{id}/activate`: ativa versão específica.
4. `GET /api/v1/versions/{id}/diff`: retorna diff textual entre versões.

#### Frontend
- `BpmnEditor`: carrega bpmn-js (lazy), importa XML vazio ou inicial, auto-layout via ELK.
- `Copilot`: envia comandos para `/api/v1/edit` usando `NEXT_PUBLIC_API_URL`.
- `VersionDiffViewer`: compara versões visualmente usando `bpmn-js-differ`.

### Fluxos Previstos (Fases Futuras)

#### Review/Approval (Fase 3)
1. `POST /api/v1/review/request`: cria proposta de mudança a partir de versão.
2. `POST /api/v1/review/{id}/comment`: adiciona comentário à proposta.
3. `PUT /api/v1/review/{id}/approve`: aprova proposta.
4. `PUT /api/v1/review/{id}/promote`: promove versão aprovada para ativa.
5. Frontend: fluxo visual de aprovação, lista de mudanças pendentes.

#### Comentarios Ancorados (Fase 3)
1. `POST /api/v1/comments`: cria comentário ancorado em elemento/versão.
2. `GET /api/v1/comments`: lista comentários por processo/versão.
3. `PUT /api/v1/comments/{id}/resolve`: marca comentário como resolvido.
4. Frontend: comentários inline no diagrama, threads, notificações.

#### RAG Multimodal (Fase 4)
1. `POST /api/v1/ingest/upload`: suporta texto, PDF, DOCX, imagens (OCR), áudio/vídeo (ASR).
2. Pipeline: OCR/ASR → chunking → embeddings → `EmbeddingChunk` com metadados (fonte, página/timestamp).
3. `POST /api/v1/generate`: RAG grounded obrigatório, citações em `meta` dos elementos.
4. `GET /api/v1/evidence`: lista evidências por versão/elemento.

#### Relatorios (Fase 4)
1. `POST /api/v1/reports/pop`: gera POP (Procedimento Operacional Padrão) a partir de processo.
2. `POST /api/v1/reports/summary`: gera resumo executivo.
3. `POST /api/v1/reports/compliance`: gera relatório de conformidade (quem mudou, baseado em que, aprovado por quem).

#### Integracoes (Fase 5)
1. Webhooks: eventos de mudança de processo/versão → webhook configurado.
2. Conectores: Jira/ServiceNow/ERP/CRM → sincronização bidirecional.
3. SSO: autenticação via SAML/OIDC.

## 4. Decisoes de Arquitetura

### Decisoes Fundamentais (Atuais e Futuras)
- **JSON-first**: BPMN_JSON é a representação interna. XML apenas em bordas (import/export/visualização). Fonte de verdade: `packages/shared-schemas/src/bpmn_json.schema.json`.
- **Schema único**: `packages/shared-schemas` é fonte de verdade; geração automática de tipos TS e modelos Pydantic.
- **Editor plugável**: bpmn.io como motor de desenho; contrato de entrada/saída é BPMN_JSON + eventos de patch. Facilita troca futura do motor.
- **Layout**: ELK.js no frontend (atual); backend layout opcional servidor (futuro).
- **RAG e IA**: operar sobre JSON e patch ops; nunca acoplar à UI. Registrar evidências usadas (artefatos, trechos) em cada versão.
- **Versionamento**: cada alteração gera `ModelVersion` com diffs, autor, mensagem de commit; fluxo de aprovação promove versões.
- **BYOK**: chaves de LLM nunca logadas/persistidas; escopo por organização; logging sem dados sensíveis.
- **Multi-tenancy**: isolamento por `organization_id` em todas as tabelas principais; Row Level Security (Fase 2+).
- **Design System**: tokens centralizados, componentes reutilizáveis, temas customizáveis (Sprint 2.5, Fase 1).
- **Observabilidade**: `request_id` em todos os logs, tracing na pipeline de geração/edição/RAG, métricas de performance.
- **Ingestão multimodal**: suportar PDF/DOCX/imagem (OCR) e áudio/vídeo (ASR) com metadados de tempo; armazenar transcrição e referenciar trechos (timestamp) como evidências (Fase 4).

## 5. Gap vs Visao Final

### Implementado (Fase 1)
- ✅ Versionamento básico: criar versões, ativar, histórico, diff textual.
- ✅ Diff visual: comparação lado a lado com highlights (Sprint 5).
- ✅ Autenticação: JWT, isolamento por organização.
- ✅ UI de projetos: dashboard, criação, listagem de processos.
- ✅ Integração Studio: carregar processos, salvar versões.

### Em Progresso (Fase 2)
- 🟡 Catálogo de processos: filtros avançados (status, área, dono, projeto).
- 🟡 Refinamento de UI/UX: aplicar design system (Sprint 2.5 planejado).
- 🟡 Segurança org-level: Row Level Security, papéis iniciais.

### Previsto (Fase 3)
- ❌ **Colaboração**: comentários ancorados, workflow de review/approval, notificações (email/Slack/Teams).
- ❌ **Permissões avançadas**: papéis (viewer, editor, reviewer/aprovador, admin).

### Previsto (Fase 4)
- ❌ **Multimodal RAG**: ingestão de áudio/vídeo (ASR) e OCR robusto; grounding com citações obrigatório.
- ❌ **Rastreabilidade**: evidências vinculadas a elementos/versões, export de rastreabilidade.
- ❌ **Relatórios**: POPs, manuais, resumos executivos, conformidade.

### Previsto (Fase 5)
- ❌ **Segurança enterprise**: RBAC avançado, SSO (SAML/OIDC), isolamento multi-tenant reforçado, políticas de retenção.
- ❌ **Editor UX avançada**: alinhar/distribuir, cores/status, visões por papel/sistema/risco, paletas setoriais.
- ❌ **Integrações**: Jira/ServiceNow/ERP/CRM, webhooks, API pública.
- ❌ **Prompts/Orquestração**: LangGraph/prompts centralizados (`packages/prompts`).
- ❌ **Observabilidade completa**: métricas (Prometheus/Grafana), tracing (OpenTelemetry), alertas.

## 6. Arquitetura Alvo (alto nivel - prevista)

### Frontend (Next.js)
- **Design System (Sprint 2.5)**: tokens de design (cores, tipografia, espaçamento), componentes base reutilizáveis, sistema de temas.
- **Features por domínio**:
  - `features/catalog/`: catálogo de processos com filtros (área, dono, status, risco), busca semântica.
  - `features/process/`: editor BPMN (bpmn-js), copilot integrado, versionamento visual.
  - `features/collaboration/`: comentários ancorados inline, threads, resolução.
  - `features/approval/`: fluxo de review/approval, lista de mudanças pendentes.
  - `features/evidence/`: visualização de evidências por versão/elemento, rastreabilidade.
  - `features/versioning/`: timeline de versões, diff visual (add/remove/modify), branches/ambientes.
- **Editor avançado**: ações de alinhar/distribuir, cores por tipo/status, visões por papel/sistema/risco, paletas setoriais.
- **UX Enterprise**: temas customizáveis por organização, dashboards executivos, relatórios visuais, onboarding guiado.

### Backend (FastAPI)
- **API (`api/v1/`)**:
  - `processes/`: CRUD de processos, catálogo com filtros, busca semântica.
  - `versions/`: criar/ativar versões, histórico, diff textual/visual, branches/ambientes.
  - `review/`: criar proposta, revisar, aprovar, promover versão ativa.
  - `comments/`: comentários ancorados em elementos/versões, threads, resolução.
  - `evidence/`: vincular evidências a versões/elementos, export de rastreabilidade.
  - `export/`: XML BPMN 2.0, PNG/PDF, JSON interno, relatórios (POPs/resumos).
  - `search/`: busca semântica em artefatos e processos (RAG).
  - `ingest/`: upload multimodal (texto, PDF, DOCX, imagens, áudio/vídeo).
  - `auth/`: autenticação, SSO (SAML/OIDC), RBAC avançado.
- **Services**:
  - `services/ingestion/`: OCR robusto, ASR (transcrição áudio/vídeo), chunking inteligente, embeddings.
  - `services/rag/`: retriever com filtros (org/projeto/processo), grounding obrigatório, rerank, citações.
  - `services/bpmn/`: conversores JSON↔XML, patch operations, lint rules, diffs semânticos, layout opcional servidor.
  - `services/agents/`: copilot com prompts versionados, orquestração (LangGraph futuro), síntese, linter.
  - `services/notifications/`: email, Slack/Teams, webhooks para mudanças.
  - `services/reports/`: geração de POPs, manuais, resumos executivos, relatórios de conformidade.
  - `services/integrations/`: conectores Jira/ServiceNow/ERP/CRM, webhooks, API pública.
- **DB**: Postgres + pgvector para embeddings, modelos de dados completos (Organization, Project, ProcessModel, ModelVersion, Comment, ReviewRequest, Artifact, EmbeddingChunk, AuditEntry, User, Role).
- **Storage**: MinIO/S3 para artefatos, transcrições, evidências.

### Infraestrutura
- **Filas**: Celery/Redis para ingest/IA pesada, jobs assíncronos.
- **Observabilidade**: logs estruturados (JSON), `request_id`, métricas (Prometheus/Grafana), tracing (OpenTelemetry), alertas.
- **Segurança**: SSO (SAML/OIDC), RBAC avançado, isolamento multi-tenant forte, políticas de retenção, trilha de auditoria completa.
- **Escala**: multi-tenant com isolamento, pooling de DB, cache de embeddings/layout, rate limiting.

## 7. Roadmap Tecnico (amarrado a arquitetura)

### Fase 1 - MVP Interno (2-3 meses) ✅ Concluída
- ✅ Estabilizar API: export XML real, layout/patch estáveis, geração sem defaults mutáveis.
- ✅ UI de projetos/processos: dashboard, criação, listagem, integração com Studio.
- ✅ Versionamento básico: criar versões, ativar, histórico, diff textual.
- ✅ BYOK e auth simples: JWT, isolamento por organização.
- ✅ Proxy frontend->API: `NEXT_PUBLIC_API_URL`.
- 🎨 **Sprint 2.5 (Planejado)**: Design System & UI/UX para conversão.

### Fase 2 - Repositório + Versionamento Real (3-4 meses) 🔄 Em Andamento
- ✅ Endpoints de versionamento: criar, ativar, histórico, diff textual.
- ✅ Diff visual: comparação lado a lado com highlights.
- 🟡 Catálogo de processos: status, filtros por área/dono/projeto.
- 🟡 Segurança org-level: Row Level Security, papéis iniciais (viewer/editor/admin).
- 🟡 Refinamento UI/UX: aplicar design system em todas as telas.

### Fase 3 - Colaboração, Comentários, Aprovação (3-4 meses) 🔮 Previsto
- Comentários ancorados: inline no diagrama, threads, resolução.
- Fluxo de aprovação: criar proposta, revisar, aprovar, promover versão ativa.
- Permissões por papel: viewer, editor, reviewer/aprovador, admin.
- Notificações: email/Slack/Teams para comentários e approvals.

### Fase 4 - Rastreabilidade, RAG Real, Relatórios (4-6 meses) 🔮 Previsto
- RAG multimodal: OCR robusto, ASR (transcrição áudio/vídeo), chunking inteligente.
- Grounding obrigatório: citações em `meta` dos elementos, evidências por versão.
- Tela de evidências: listar docs/trechos usados por versão e por elemento.
- Relatórios automáticos: POPs, manuais, resumos executivos, conformidade.

### Fase 5 - Enterprise (6-12 meses) 🔮 Previsto
- SSO/RBAC avançado: SAML/OIDC, papéis granulares, políticas de retenção.
- Multi-tenant forte: isolamento reforçado, jobs assíncronos para ingest/IA pesada.
- Integrações: Jira/ServiceNow/ERP/CRM, webhooks, API pública.
- UX avançada: paletas setoriais, visões por papel/sistema/risco, temas customizáveis.
- Observabilidade completa: métricas (Prometheus/Grafana), tracing (OpenTelemetry), alertas.

## 8. Padroes e Regras Praticas
- **Schema**: alterar `bpmn_json.schema.json` -> regenerar tipos (`pnpm run generate`) -> commit conjunto.
- **Imports**: relativos dentro de app; compartilhado em `packages/`.
- **Seguranca**: nunca logar segredos; BYOK estrito; rate limiting e validacao de inputs (30MB max, MIME).
- **Logging/Metricas**: logs estruturados, `request_id`; health checks; metricas de latencia/erros/qualidade BPMN.
- **Cache**: embeddings e layout podem ser cacheados; invalidar ao alterar artefatos/modelos.

## 9. Componentes Criticos a Evoluir

### Backend
- `agents/pipeline.py`: conectar RAG real (Fase 4), prompts versionados, layout opcional servidor.
- `bpmn/patch.py`: ampliar operações e `meta` set_property com suporte a evidências (Fase 4).
- `services/ingestion/`: OCR robusto, ASR (transcrição áudio/vídeo), pipelines robustos, workers assíncronos (Fase 4).
- `rag/retriever.py`: embeddings reais, filtros por org/projeto/processo, rerank, grounding obrigatório (Fase 4).
- `api/v1/review.py`: fluxo de aprovação, criação de proposta, revisão, promoção (Fase 3).
- `api/v1/comments.py`: comentários ancorados, threads, resolução (Fase 3).
- `services/notifications/`: email, Slack/Teams, webhooks (Fase 3).
- `services/reports/`: geração de POPs, resumos, conformidade (Fase 4).
- `services/integrations/`: conectores Jira/ServiceNow/ERP/CRM (Fase 5).
- `services/auth/`: SSO (SAML/OIDC), RBAC avançado (Fase 5).

### Frontend
- `design-system/`: tokens, componentes base, temas (Sprint 2.5, Fase 1).
- `features/catalog/`: catálogo de processos com filtros avançados (Fase 2).
- `features/collaboration/`: comentários inline, threads (Fase 3).
- `features/approval/`: fluxo de review/approval (Fase 3).
- `features/evidence/`: visualização de evidências por versão/elemento (Fase 4).
- `features/bpmn/editor/`: ações de alinhar/distribuir, cores por tipo/status, visões avançadas (Fase 5).

## 10. Design System e UI/UX (Sprint 2.5, Fase 1)

### Objetivo
Criar uma UI/UX que converta usuários e impressione empresas/consultores, garantindo consistência visual e experiência de uso superior.

### Componentes Previstos
- **Tokens de Design**: cores (paleta primária/secundária, estados), tipografia (fontes, tamanhos, pesos), espaçamento (grid, padding, margin), sombras/elevação, bordas/radius.
- **Componentes Base**: botões, inputs, modais, toasts, cards, breadcrumbs, menus contextuais, tabelas, filtros.
- **Onboarding**: landing page atrativa, tour guiado interativo, empty states informativos e acolhedores.
- **Navegação**: hierarquia visual clara, breadcrumbs consistentes, menus contextuais, navegação por teclado (acessibilidade).
- **Microinterações**: loading states elegantes, animações sutis, feedback visual imediato, transições suaves.
- **Responsividade**: mobile-first, breakpoints consistentes, layouts adaptativos.
- **Acessibilidade**: contraste adequado (WCAG AA), navegação por teclado, screen readers, ARIA labels.
- **Temas**: suporte a temas customizáveis por organização (Fase 5), modo claro/escuro.

### Integração com Features
- Aplicar design system em todas as novas telas (Fase 2+).
- Garantir consistência visual entre catálogo, editor, comentários, aprovação.
- Evoluir para UX enterprise: paletas setoriais, visões por papel/sistema/risco (Fase 5).

## 11. Observabilidade e Qualidade

### Implementado
- ✅ Logs estruturados (JSON) com `request_id` em todas as requisições.
- ✅ Health checks: DB + MinIO.
- ✅ Tratamento de erros centralizado e padronizado.
- ✅ BYOK Security: filtros para garantir que API keys nunca apareçam nos logs.

### Previsto
- **Testes**: aumentar cobertura em geração/edição/RAG; fixtures realistas BPMN_JSON; testes E2E.
- **Lint/format**: ruff para Python, eslint para TS; CI/CD com validação.
- **Tracing**: instrumentar pipeline de geração/edição/RAG (Supervisor -> spans OpenTelemetry).
- **Métricas**: Prometheus/Grafana para latência, erros, throughput, qualidade BPMN.
- **Alertas**: configuração de alertas para erros críticos, latência alta, degradação de qualidade.
- **KPIs técnicos**: P95 ingest/geração, taxa de erros, precisão de grounding, lint pass rate, tempo de aprovação.
- **Auditoria**: trilha completa de ações (quem mudou o que, aprovado por quem) - Fase 5.
