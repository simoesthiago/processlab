# ProcessLab - Arquitetura de Codigo

## 1. Visao Geral
Monorepo (`processlab/`) com tres pilares:
- **apps/api**: FastAPI (Python) - ingestao, geracao/edicao/exportacao de BPMN, RAG, versionamento, auditoria.
- **apps/web**: Next.js (TypeScript/React) - editor BPMN (bpmn-js), copilot, catalogo de processos.
- **packages/shared-schemas**: Fonte de verdade do `BPMN_JSON` (schema JSON + tipos TS + modelos Pydantic).

JSON e a fonte de verdade; XML e usado apenas em bordas (import/export/visualizacao).

## 2. Estrutura Atual do Repositorio
- `apps/api`
  - `app/main.py`: instancia FastAPI, CORS/TrustedHost, inclui rotas `/api/v1`.
  - `app/api/v1/`: endpoints `generate`, `edit`, `export`, `search` + `endpoints/ingestion`.
  - `app/services/`:
    - `agents/`: `pipeline.py` (orquestra geracao), `synthesis.py` (heuristica), `linter.py` (regras BPMN), `layout.py` (stub), `supervisor.py` (telemetria).
    - `bpmn/`: `json_to_xml.py`, `xml_to_json.py`, `patch.py` (aplica patches), `layout.py` (frontend fallback).
    - `ingestion/`: docx/pdf/text/ocr chunking/pipeline (stubs em evolucao).
    - `rag/`: embeddings, retriever, indexer (usa pgvector).
    - `storage/`, `vector/`: infra de suporte (placeholders).
  - `app/db/`: `models.py` (ProcessModel, ModelVersion, Artifact, EmbeddingChunk, AuditEntry, User), `session.py`.
  - `app/workers/`: Celery tasks (`ingest_artifact_task`).
  - `tests/`: cobertura basica de generate/edit/lint/health.
- `apps/web`
  - `src/features/bpmn/`: `editor/BpmnEditor.tsx` (bpmn-js + ELK), `layout`, `linting`, `io`, `sync` (stubs).
  - `src/features/copiloto/Copilot.tsx`: chat de edicao chamando `/api/v1/edit`.
  - `src/features/citations/`: placeholder.
  - `src/app/page.tsx`: template Next (a substituir por UI do produto).
  - Config: Next 16, React 19, Tailwind 4 (nao configurado), ESLint.
- `packages/shared-schemas`
  - `src/bpmn_json.schema.json`: schema principal.
  - `src/types.ts`: tipos TS gerados.
  - `src/models.py`: modelos Pydantic gerados.
- `infra/compose/docker-compose.yml`: stack local (api, web, worker stub, db pgvector, minio).
- `docs/`: PRD, roadmap, rules (dev/security), este code_architecture.

## 3. Fluxos Principais (estado atual)
### Geracao (API)
1. `POST /api/v1/generate`: recebe `artifact_ids`, `process_name`.
2. `agents/pipeline.generate_process`: recupera contexto (stub), sintetiza BPMN_JSON, lint, converte para XML, layout (stub), retorna metricas.
3. Persiste `ProcessModel` e `ModelVersion`, vincula `ModelVersionArtifact`.

### Edicao (API)
1. `POST /api/v1/edit`: recebe comando NL + BPMN_JSON/XML ou `model_version_id`.
2. Interpreta comando (regex), resolve nomes->IDs, aplica patch (`BpmnPatchService`), lint, cria nova `ModelVersion`, registra `AuditEntry`.

### Ingestao (API)
1. `POST /api/v1/ingest/upload`: upload para MinIO, cria `Artifact`, dispara `ingest_artifact_task`.
2. Pipeline de ingestao (stubs): chunking + embeddings -> `EmbeddingChunk`.

### Export (API)
1. `POST /api/v1/export`: converte BPMN_JSON -> XML (real), PNG (stub), JSON (base64).

### Frontend
- `BpmnEditor`: carrega bpmn-js (lazy), importa XML vazio ou inicial, auto-layout via ELK.
- `Copilot`: envia comandos para `/api/v1/edit` usando `NEXT_PUBLIC_API_URL`.

## 4. Decisoes de Arquitetura (atuais)
- **JSON-first**: BPMN_JSON e a representacao interna. XML so em borda (PRD/Rules).
- **Schema unico**: `packages/shared-schemas` e fonte de verdade; geracao de TS/Pydantic.
- **Editor plugavel**: bpmn.io como motor; entrada/saida e BPMN_JSON + eventos de patch.
- **Layout**: ELK.js no frontend; backend layout stub.
- **RAG inicial**: embeddings aleatorios (stub), retriever em pgvector; ingest incompleta.
- **BYOK**: chaves de usuario nao sao persistidas; evitar logging de segredos.

## 5. Gap vs Visao Final
- **Multimodal RAG**: falta ingestao de audio/video (ASR) e OCR robusto; grounding com citacoes ainda nao implementado.
- **Versionamento forte**: faltam diff visual, branches/ambientes, promocoes com aprovacao.
- **Colaboracao**: comentarios ancorados, workflow de review/approval, notificacoes.
- **Seguranca enterprise**: RBAC avancado, SSO, isolamento multi-tenant reforcado.
- **Editor UX**: alinhar/distribuir, cores/status, visoes por papel/sistema/risco; homepage/UI de catalogo ainda e template.
- **Prompts/Orquestracao**: rules citam LangGraph/prompts centralizados, mas nao existem ainda.

## 6. Arquitetura Alvo (alto nivel)
- **Frontend (Next.js)**: features por dominio (catalogo, processo, comentarios, aprovacao). Editor bpmn.io plugado ao contrato JSON; acoes de alinhar/distribuir; comentarios inline; diff visual.
- **Backend (FastAPI)**:
  - `api/v1`: processos, versoes, review/approval, comentarios, evidencias, export, search.
  - `services/ingestion`: OCR/ASR, chunking, embeddings; workers para processamento pesado.
  - `services/rag`: retriever com filtros por org/projeto/processo; grounding obrigatorio.
  - `services/bpmn`: conversores, patch, lint; diffs; layout opcional servidor.
  - `services/agents`: copilot com prompts versionados, orquestracao (LangGraph) futura.
  - `db`: Postgres + pgvector; MinIO/S3 para artefatos.
- **Infra**: Celery/Redis para filas; observabilidade (logs JSON, metricas, tracing); SSO/RBAC.

## 7. Roadmap Tecnico (amarrado a arquitetura)
- **Curto prazo (Fase 1-2)**: estabilizar API (export real, remover stubs criticos), UI catalogo/processos, versionamento basico, BYOK e auth simples, proxy frontend->API. Tests/linters.
- **Medio prazo (Fase 3)**: comentarios/approval, diff visual, papeis e permissoes, notificacoes.
- **Medio/Longo (Fase 4)**: RAG multimodal (OCR/ASR), grounding com citacoes em meta, evidencias por elemento/versao, relatorios automaticos.
- **Longo (Fase 5)**: SSO/RBAC avancado, multi-tenant forte, integracoes (Jira/ServiceNow/ERP/CRM), observabilidade completa, UX avancada do editor.

## 8. Padroes e Regras Praticas
- **Schema**: alterar `bpmn_json.schema.json` -> regenerar tipos (`pnpm run generate`) -> commit conjunto.
- **Imports**: relativos dentro de app; compartilhado em `packages/`.
- **Seguranca**: nunca logar segredos; BYOK estrito; rate limiting e validacao de inputs (30MB max, MIME).
- **Logging/Metricas**: logs estruturados, `request_id`; health checks; metricas de latencia/erros/qualidade BPMN.
- **Cache**: embeddings e layout podem ser cacheados; invalidar ao alterar artefatos/modelos.

## 9. Componentes Criticos a Evoluir
- `agents/pipeline.py`: conectar RAG real, prompts, layout opcional servidor.
- `bpmn/patch.py`: ampliar operacoes e meta set_property com suporte a evidencias.
- `services/ingestion`: OCR/ASR, pipelines robustos, workers assincronos.
- `rag/retriever.py`: embeddings reais, filtros, rerank/grounding.
- `web`: substituir homepage, integrar editor/copilot em UI de produto, adicionar comentarios/diff/approval.

## 10. Observabilidade e Qualidade
- **Testes**: cobertura em geracao/edicao/RAG; fixtures realistas BPMN_JSON.
- **Lint/format**: ruff para Python, eslint para TS.
- **Tracing**: instrumentar pipeline de geracao/edicao/RAG (Supervisor -> spans).
- **KPIs tecnicos**: P95 ingest/geracao, taxa de erros, precisao de grounding, lint pass rate.
