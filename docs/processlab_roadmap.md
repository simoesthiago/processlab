# ProcessLab - Visao, Problema e Roadmap Tecnico

## Ideia e Problema que Resolvem
- Produto: Plataforma SaaS de governanca e modelagem de processos ("GitHub de processos"), com editor BPMN + copilot de IA + versionamento, comentarios, aprovacao, rastreabilidade de evidencias.
- Problema: Hoje consultorias entregam "foto/fluxograma" estatico. Falta um repositorio vivo que:
  - Controle versoes, historico e aprovacoes.
  - Traga rastreabilidade de evidencias (docs, reunioes, tickets) que embasaram o modelo.
  - Permita colaboracao (comentarios, sugestoes, PR de processo).
  - Acelere mapeamento/edicao com IA e garanta governanca/compliance.

## Visao Final (estado alvo, ARR 100M)
- Repositorio vivo de processos com estados (rascunho, revisao, ativo, obsoleto), donos, SLA, riscos.
- Copilot de processos: ingestao inteligente (docs/tickets/atas), geracao e edicao conversacional, insights de riscos/gargalos, documentacao automatica.
- Git de processos: versionamento completo, diff visual entre versoes, branches/ambientes (prod/sandbox/projeto), aprovacao/merge.
- Rastreabilidade e compliance: evidencias vinculadas a cada versao, trilha de auditoria, relatorios (ISO/SOX/LGPD).
- UX enterprise: editor BPMN com cores, alinhamento/distribuicao, auto-layout, comentarios ancorados, visoes por papel/sistema/risco.
- Integracoes: SSO, Slack/Teams, Jira/ServiceNow/ERP/CRM, webhooks e API publica.

## Roadmap por Fases e Sprints (tecnico e incremental)

### Fase 1 - MVP interno para consultoria (2-3 meses)
Objetivo: Consultores usam para mapear processos com IA e guardar versoes basicas.
- Backend
  - Fechar ciclo ingest -> generate -> edit (TXT/PDF minimo, OCR se trivial).
  - Modelar `Organization`, `Project`, `ProcessModel`, `ModelVersion` (base ja existe).
  - Autenticacao simples (usuarios da consultoria) e escopo por organizacao.
  - Corrigir stubs: export XML real, layout/patch estaveis, geracao sem defaults mutaveis.
- Frontend
  - Tela inicial: lista de clientes (workspaces) e projetos.
  - Tela de processo: `BpmnEditor` + `Copilot` integrados; salvar/abrir versoes.
  - Proxy/env var para chamar API real (`NEXT_PUBLIC_API_URL`).
- Infra
  - Docker Compose estavel (db, api, web, minio).
  - Logs estruturados e `request_id`.
- Sprints sugeridos
  - S1: Autenticacao simples + models/org/project + API estavel (ingest/generate/edit/export).
  - S2: UI de projetos/processos + editor/copilot na mesma pagina + salvar/abrir.
  - S2.5: **Design System & UI/UX para Conversao** (foco em converter usuarios e impressionar empresas/consultores)
    - Design system completo: tokens de design (cores, tipografia, espacamento), componentes base reutilizaveis.
    - Onboarding e primeira impressao: landing page, tour guiado, empty states atrativos.
    - Navegação intuitiva: breadcrumbs, menus contextuais, hierarquia visual clara.
    - Microinteracoes e feedback: loading states elegantes, animacoes sutis, toasts informativos.
    - Responsividade e acessibilidade: mobile-first, contraste adequado, navegacao por teclado.
    - Polimento visual: espacamento consistente, alinhamento, sombras/elevacao, iconografia.
  - S3: Hardening (erros, logs, BYOK seguro) + deploy dev (compose).

### Fase 2 - Repositorio + Versionamento real (3-4 meses)
Objetivo: Virar "Git de processos" inicial.
- Backend
  - Endpoints de criar nova versao a partir de outra, ativar versao, mensagem de commit.
  - Diff basico (backend entrega delta de elementos/flows).
  - Auditoria consistente em `AuditEntry`.
- Frontend
  - Catalogo de processos: status, filtros por area/dono/projeto.
  - Linha do tempo de versoes; diff visual (highlight add/remove/rename).
  - Refinamento de UI/UX: aplicar design system do S2.5 em todas as novas telas, garantir consistencia visual.
- Seguranca
  - Separacao de dados por organizacao; papeis iniciais (viewer/editor/admin).
- Sprints sugeridos
  - S4: Endpoints de versionamento + ativacao + mensagem de commit.
  - S5: UI catalogo + timeline + diff visual.
  - S6: Seguranca org-level + ajustes de auditoria.

### Fase 3 - Colaboracao, Comentarios, Aprovacao (3-4 meses)
Objetivo: Pull requests de processo, comentarios ancorados e approvals.
- Backend
  - Modelos `Comment` (ancorado em elemento/versao), `ReviewRequest` (proposta -> revisao -> aprovacao).
  - Permissoes por papel: viewer, editor, reviewer/aprovador, admin.
- Frontend
  - Comentarios inline no diagrama; threads, marcar resolvido.
  - Fluxo de aprovacao: criar proposta, revisar, aprovar/promover para ativa.
  - Lista de mudancas pendentes por processo/projeto.
- Integracoes
  - Notificacoes (email/Slack/Teams) para comentarios e approvals.
- Sprints sugeridos
  - S7: Comentarios ancorados + API/UX.
  - S8: Review/approval flow + promocao de versao.
  - S9: Notificacoes basicas + reforco de permissoes.

### Fase 4 - Rastreabilidade, RAG real, Relatorios (4-6 meses)
Objetivo: Evidencias claras e IA sustentada por documentos reais.
- Backend / IA
  - Ingestao robusta (PDF, DOCX, imagens com OCR), indexacao em `EmbeddingChunk`.
  - RAG integrado ao pipeline de geracao/edicao; registrar artefatos/trechos usados por versao.
  - Exportacao de evidencias por versao (JSON/relatorios).
- Frontend
  - Tela de evidencias: listar docs/trechos usados por versao e por elemento do processo.
  - Visualizacoes por risco/criticidade.
- Relatorios
  - Geracao de POPs/manuais/resumos executivos a partir dos modelos.
  - Relatorios de conformidade (quem mudou, baseado em que, aprovado por quem).
- Sprints sugeridos
  - S10: Ingest RAG real + binding de evidencias a versoes.
  - S11: UI de evidencias + filtros/links por elemento.
  - S12: Relatorios automaticos (POPs/resumos) + export de evidencias.

### Fase 5 - Enterprise (6-12 meses)
Objetivo: Escala, seguranca, extensoes setoriais e integracoes profundas.
- Seguranca e governanca
  - SSO (SAML/OIDC), RBAC avancado, politicas de retencao, trilha de auditoria completa.
- Escala
  - Multi-tenant com isolamento forte; jobs assincronos para ingest/IA pesada.
  - Observabilidade avancada (tracing, metricas, alertas).
- Editor / UX
  - Evolucao do design system (Fase 1, S2.5): paletas por setor, visoes por papel/sistema/risco, layout/alinhar/distribuir refinados.
  - Comentarios e filtros avancados, modos macro/microprocesso.
  - UX enterprise: temas customizaveis por organizacao, dashboards executivos, relatorios visuais.
- Integracoes
  - Conectores com Jira/ServiceNow/ERP/CRM, webhooks, API publica.
- Sprints sugeridos
  - S13: SSO + RBAC avancado + logs/auditoria completos.
  - S14: Hardening de escala (workers, filas, tuning DB/search).
  - S15: Conectores enterprise + UX avancada (visoes, paletas setoriais).

## Notas Tecnicas Importantes
- Modelo de dados JSON-first: manter BPMN_JSON como fonte de verdade; converter para XML so em bordas (import/export/render).
- Editor plugavel: tratar bpmn.io como motor de desenho; contrato de entrada/saida e o JSON + eventos de edicao (patch ops). Facilita trocar o motor no futuro.
- IA/copilot: operar sobre JSON e patch ops; nunca acoplar a UI. Registrar evidencias usadas (artefatos, trechos) em cada versao.
- Versionamento: cada alteracao gera `ModelVersion` com diffs, autor, mensagem de commit; fluxo de aprovacao promove versoes.
- Seguranca/BYOK: chaves de LLM nunca logadas/persistidas; escopo por organizacao; logging sem dados sensiveis.
- Observabilidade: request_id, tracing basico na pipeline de geracao/edicao; metricas de performance (tempo de ingest, geracao, lint).
- Ingestao multimodal: para RAG completo, suportar PDF/DOCX/imagem (OCR) e audio/video via transcricao (ASR) com metadados de tempo; armazenar a transcricao e referenciar trechos (timestamp) como evidencias em versoes/processos.
