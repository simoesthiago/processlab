# ProcessLab - PRD

## 1. Visao e Objetivo
- Produto: Plataforma SaaS de governanca e modelagem de processos ("GitHub de processos") com editor BPMN, copilot de IA e repositorio versionado de processos.
- Problema: Fluxogramas entregues como "foto" nao tem historico, aprovacao, rastreabilidade nem atualizacao continua.
- Objetivo: Permitir que consultores e empresas modelem, versionem, revisem, aprovem e auditem processos com apoio de IA, usando BPMN como notacao padrao e um formato interno JSON-first.

## 2. Publico-Alvo
- Consultor: cria/edita modelos, usa IA para rascunhos, quer produtividade e reutilizacao.
- Process Owner (cliente): mantem processos ativos, aprova mudancas, precisa de rastreabilidade e compliance.
- Revisor/Auditor: analisa alteracoes, solicita evidencias, gera relatorios de conformidade.
- Usuario de negocio: consome processos ativos, comenta, sugere melhorias.

## 3. Metricas de Sucesso (inicial)
- Tempo medio para gerar rascunho de processo a partir de insumos (P95).
- Percentual de elementos com evidencia vinculada (meta >= 90% nas versoes aprovadas).
- Tempo de aprovacao de mudanca (solicitacao -> aprovacao).
- Adocao: processos ativos por cliente, usuarios ativos semanais.
- Qualidade: taxa de lint OK em BPMN, precisao de grounding (respostas citam evidencia).

## 4. Escopo Funcional (MVP -> Evolucao)
### MVP (Fase 1-2)
- Editor BPMN (bpmn.io) integrado a formato interno `BPMN_JSON`; import/export XML.
- Copilot basico: comandos de edicao e geracao a partir de texto/documentos (RAG inicial).
- Repositorio por organizacao/projeto/processo; versionamento basico (criar nova versao, ativar).
- Catalogo de processos com status (rascunho, em revisao, ativo).
- Autenticacao simples; isolamento por organizacao.
- Ingestao de documentos (TXT/PDF/DOCX) com chunking, embeddings e busca semantica inicial.
- **Sistema de convites**: admins podem convidar usuarios via email; usuarios aceitam convite e definem senha.
- **Conflitos de edicao**: deteccao de edicoes simultaneas com optimistic locking; modal de resolucao de conflitos.
- **Audit log do sistema**: registro imutavel de acoes administrativas (criacao/remocao de usuarios, mudancas de permissao, exportacoes em massa).
- **Gestao de API Keys**: BYOK para LLM e chaves de API para integracoes externas; rotacao e revogacao.

### Colaboracao (Fase 3)
- Comentarios ancorados em elementos/versoes; threads.
- Fluxo de aprovacao (proposta -> revisao -> aprovacao) e promocao de versao ativa.
- Notificacoes (email/Slack/Teams) para comentarios e approvals.
- **Lixeira/Soft Delete**: recuperacao de processos/projetos deletados; exclusao permanente apos periodo configuravel (padrao 30 dias).

### Rastreabilidade e IA "excelente" (Fase 4)
- Ingestao multimodal: texto, imagem (OCR), audio/video (ASR) com timestamps.
- RAG robusto com metadados (fonte, pagina/timestamp, tipo de artefato, confidencialidade).
- Copilot grounded: gera/edita apenas com evidencias; cita fontes; bloqueia alucinacoes.
- Evidencias vinculadas a elementos/versoes; diff visual entre versoes.
- Relatorios automaticos (POPs, resumos executivos, conformidade).

### Enterprise (Fase 5)
- SSO (SAML/OIDC), RBAC avancado, trilha de auditoria completa.
- Multi-tenant forte, jobs assincronos, observabilidade (logs estruturados, metricas, tracing).
- Integracoes: Jira, ServiceNow, ERP/CRM, webhooks e API publica.
- UX avancada: visoes por papel/sistema/risco, paletas setoriais, alinhamento/distribuicao/layout refinados.
- **Monitoramento de uso**: dashboard de consumo (IA tokens, armazenamento, membros) com alertas de quota e projecao de custos.
- **Paginas de erro**: tratamento de "unhappy path" com paginas amigaveis para 403, 404, 500 e manutencao programada.

## 5. Requisitos Funcionais
1) Modelagem BPMN
   - Editar sempre em `BPMN_JSON`; converter para XML so em import/export/visualizacao.
   - Operacoes: adicionar/editar/remover nos e fluxos; auto-layout (ELK); alinhamento/distribuicao; cores por tipo/status.
2) Versionamento
   - Criar versoes com mensagem de mudanca; ativar versao; manter historico.
   - Diff visual (elementos/fluxos adicionados/removidos/renomeados).
3) Aprovacao/Review
   - Criar proposta de mudanca; revisao e aprovacao antes de tornar ativa.
   - Comentarios ancorados; status de threads (aberta/resolvida).
4) RAG/IA
   - Ingestao multimodal (texto/OCR/ASR) com chunking + embeddings; filtros por organizacao/projeto/processo.
   - Copilot grounded: citar fonte (artefato + pagina/timestamp); negar criacao sem evidencia.
   - Lint pos-edicao (BPMN rules).
5) Rastreabilidade
   - Armazenar em `meta` dos elementos: `sourceArtifactId`, `page/timestamp`, tipo de evidencia.
   - Tela de evidencias por versao/elemento.
6) Catalogo e Busca
   - Lista de processos por organizacao/projeto; filtros (area, dono, status, risco).
   - Busca semantica em artefatos e processos (RAG).
7) Exportacao
   - XML BPMN 2.0; PNG/PDF do diagrama; JSON interno; relatorios (POPs/resumos) com citacoes.
8) Integracoes
   - Webhooks para mudancas de processo/versao; conectores Slack/Teams para notificacoes.
9) Gestao de Usuarios e Convites (Fase 2)
   - Admins podem criar convites por email com role definida (viewer/editor/admin).
   - Usuarios convidados acessam rota publica `/invite/[token]` para definir senha e entrar na organizacao.
   - Convites expiram apos periodo configuravel (padrao 7 dias).
10) Conflitos de Edicao (Fase 2)
    - Optimistic locking: versoes incluem timestamp/etag; salvar verifica se base mudou.
    - Se conflito detectado (409 Conflict), frontend exibe modal com opcoes:
      - Sobrescrever (Force Push): apenas admin, descarta mudancas do servidor.
      - Salvar como Copia: cria novo processo/branch com mudancas locais.
      - Mesclar/Ver Diff: abre comparador visual antes de salvar.
11) Audit Log do Sistema (Fase 2)
    - Registro imutavel de acoes administrativas: criacao/remocao de usuarios, mudancas de permissao, exportacoes em massa, alteracoes de plano.
    - Log inclui: timestamp, usuario, IP, user agent, tipo de evento, recurso afetado, snapshots before/after.
    - Interface de visualizacao com filtros e exportacao (CSV/JSON) para compliance.
12) Soft Delete e Lixeira (Fase 3)
    - Exclusao de processos/projetos e "soft" (marca `deleted_at`, nao remove do banco).
    - Interface de lixeira permite restaurar ou excluir permanentemente.
    - Exclusao permanente automatica apos periodo de retencao (padrao 30 dias, configuravel).
13) Gestao de API Keys (Fase 2)
    - Criacao de chaves BYOK para LLM (nao persistidas, usadas apenas no request).
    - Criacao de chaves de API para integracoes externas (com rotacao e revogacao).
    - Logs de uso por chave; mascara de seguranca (mostra apenas ultimos 4 caracteres).
14) Monitoramento de Uso (Fase 5)
    - Dashboard de consumo: tokens de IA, armazenamento (GB), membros ativos.
    - Graficos de tendencia; alertas de quota (80%, 90%, 100%).
    - Projecao de custos e comparacao com limites do plano.

## 6. Requisitos Nao Funcionais
- Seguranca: BYOK (nao persistir chaves), jamais logar segredos; RBAC por organizacao; CORS/TrustedHost configuravel.
- Performance: ingestao/geracao P95 < 60s em MVP; UI responsiva; layout automatico em segundos para diagramas medios.
- Escalabilidade: suporte a multiplas organizacoes; filas para ingest/IA; pooling de DB; cache de embeddings/layout.
- Confiabilidade: health checks; timeouts e retries; graceful degradation (fallback de IA/layout).
- Observabilidade: logs estruturados (JSON), `request_id`, metricas (latencia, erros, throughput), tracing na pipeline de geracao/edicao/RAG.
- Compliance: auditoria de acoes (quem mudou o que, aprovado por quem); politicas de retencao de artefatos/transcricoes conforme cliente; audit log do sistema para acoes administrativas.
- Conflitos de edicao: optimistic locking previne perda de dados em edicoes simultaneas; interface de resolucao de conflitos.
- Recuperacao de dados: soft delete permite restaurar processos/projetos deletados acidentalmente; periodo de retencao configuravel.

## 7. Arquitetura de Referencia (atual + alvo)
- Monorepo (`processlab`): `apps/api` (FastAPI), `apps/web` (Next.js 16 / React 19 + bpmn.io), `packages/shared-schemas` (BPMN_JSON schema/types/models).
- Fonte de verdade: `BPMN_JSON` (`packages/shared-schemas/src/bpmn_json.schema.json`); tipos gerados TS/Pydantic.
- Editor: bpmn-js como motor; ELK para layout; UI React/Next.
- Backend:
  - API: ingest/generate/edit/export/search; versionamento; auditoria.
  - Services: agents (synthesis, linter, layout stub), bpmn converters, RAG (retriever/indexer/embeddings), ingestion (docx/pdf/ocr/audio/video na fase 4), workers (Celery).
  - DB: Postgres + pgvector para embeddings.
  - Storage: MinIO para artefatos.
- IA/RAG: embeddings + retriever; grounding obrigatorio; prompts centralizados (quando existir `packages/prompts`).

## 8. Roadmap por Fase (resumo)
- F1 (MVP interno): editor+copilot basico, ingest TXT/PDF, versionamento simples, catalogo, auth basica.
- F2 (Git de processos inicial): versoes com mensagem/ativacao, diff visual, catalogo com filtros, auditoria reforcada.
- F3 (colaboracao): comentarios ancorados, fluxo de aprovacao, notificacoes, papeis.
- F4 (rastreabilidade/IA forte): ingestao multimodal (OCR/ASR), RAG robusto, copilot grounded com citacoes, evidencias por elemento, relatorios.
- F5 (enterprise): SSO/RBAC avancado, multi-tenant forte, observabilidade, integracoes profundas, UX avancada.

## 9. Dependencias e Restricoes
- Basear editor em bpmn.io inicialmente; manter contrato JSON para eventual troca.
- Manter schema unico; proibido tipos divergentes.
- Sujeito a limites de custo/uso de LLMs; BYOK obrigatorio em clientes sensiveis.
- Garantir encoding/acentuacao correta em docs/codigo (evitar caracteres corrompidos).

## 10. Riscos e Mitigacoes
- Alucinacao da IA: grounding obrigatorio, citacoes, lint, testes de precisao/recall RAG.
- Escala de ingestao/IA: usar filas/workers; limites de tamanho (30MB por upload na base); transcricao pode ser custosa -> processar assincrono.
- Seguranca multi-tenant: isolar dados por organizacao; testes de permissao; revisao de logs sem dados sensiveis.
- Adocao do usuario: UX de edicao/colaboracao clara; diffs visuais; "por que" das mudancas acessivel (evidencias).

## 11. Criterios de Aceite (MVP)
- Criar/abrir processos por organizacao/projeto; gerar rascunho via IA a partir de pelo menos um documento; editar com copilot; salvar versao e ativar.
- Exportar XML e JSON interno; lint basico sem erros criticos.
- Catalogo com status; historico de versoes visivel; auditoria registrada.
- Autenticacao basica e isolamento por organizacao; BYOK sem persistir ou logar chaves.
