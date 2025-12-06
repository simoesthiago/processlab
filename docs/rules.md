# ProcessLab - Regras de Desenvolvimento e Seguranca

## Seguranca
1. Nunca logar segredos
   - Proibido logar API keys, tokens, senhas ou qualquer credencial.
   - BYOK: chaves de usuario sao usadas somente no request e nunca persistidas.
2. Rate limiting
   - Todas as rotas publicas devem ter rate limiting; endpoints do copilot com limites mais restritos.
3. Validacao de entrada
   - Validar inputs com Pydantic; limite de upload 30MB; validar MIME types.
4. CORS e TrustedHost
   - Dev: localhost:3004; Prod: dominios especificos; usar middlewares FastAPI.
5. RBAC e multi-tenant
   - Escopo por organizacao; roles (viewer/editor/reviewer/admin). SSO (SAML/OIDC) em fases avançadas.

## Arquitetura
6. Formato interno JSON
   - Editar sempre em BPMN_JSON; XML apenas em import/export/visualizacao.
7. Schema como fonte de verdade
   - Unico schema: `packages/shared-schemas/src/bpmn_json.schema.json`; gerar TS/Pydantic; proibido tipos divergentes.
8. Layout automatico
   - Usar ELK.js para layout de pools/lanes; ajustar no frontend ou backend opcional.
9. Editor plugavel
   - bpmn.io como motor atual; contrato de entrada/saida e BPMN_JSON + eventos de patch para permitir troca futura.

## Codigo e Versionamento
10. Monorepo
    - Imports relativos dentro de apps; codigo compartilhado em `packages/`; cada app/package com seu manifesto de deps.
11. Commits atomicos de schema
    - Alterou schema -> rodar `pnpm run generate` -> commitar schema + types.ts + models.py juntos.
12. Testes
    - Obrigatorios para logica critica (geracao, edicao, RAG); alvo minimo 70% nas partes criticas.
13. Versionamento de processos
    - Toda mudanca gera ModelVersion com mensagem; historico preservado; fluxo de aprovacao promove versao ativa; registrar auditoria.
14. Colaboracao
    - Comentarios ancorados e review/approval sao parte do fluxo; notificacoes em canais definidos.

## RAG e IA
15. Ingestao multimodal
    - Suportar texto (PDF/DOCX/TXT), imagem (OCR), audio/video (ASR) com metadados de pagina/timestamp; armazenar transcricoes.
16. Rastreabilidade de citacoes
    - Todo elemento gerado deve referenciar fonte via meta (sourceArtifactId, pagina/timestamp).
17. Guardrails de copilot
    - Respostas devem citar evidencias; proibido criar passos sem fonte; grounding obrigatorio; avaliar precisao/recall do RAG.
18. Prompt management
    - Centralizar prompts (ex: `packages/prompts/`) e versionar; se LangGraph for adotado, orquestracao documentada; remover do escopo ate existir.

## Error Handling e Observabilidade
19. Erros informativos
    - HTTP status apropriados; mensagens claras; logging com contexto sem dados sensiveis.
20. Graceful degradation
    - Fallbacks para servicos externos; timeouts; retries com backoff.
21. Logging e metricas
    - Logs estruturados (JSON) com request_id; metricas de latencia/erros/qualidade BPMN (GED/RGED se aplicavel).
22. Health checks
    - Endpoint `/health` em todos os servicos; verificar dependencias (DB, storage, fila).

## Frontend
23. Componentes isolados
    - Organizar por feature; props tipadas em TS; reuso sempre que possivel.
24. Estado global minimo
    - Preferir estado local; contexto/zustand apenas para compartilhado; bpmn-js nao e fonte de verdade, BPMN_JSON sim.
25. Performance
    - Lazy load do bpmn-js; memoizacao de componentes pesados; virtual scroll em listas grandes (historico, artefatos).

## Deploy e Performance
26. Variaveis de ambiente
    - Configuracoes via env vars; proibido hardcode de URLs/credenciais; validar no startup.
27. Migrations
    - Alembic versionado; com downgrade; testar em staging.
28. Database
    - Indexes para queries frequentes; evitar N+1; pooling.
29. Cache
    - Cachear embeddings e layout quando util; invalidar ao mudar artefatos/modelos.

---

Importante: Violacoes devem ser justificadas em code review e, quando necessario, registradas como ADR.
