# ProcessLab - Roadmap Completo

**Última atualização**: Dezembro de 2025

Este documento define o roadmap completo do ProcessLab, desde a concepção até o produto final gerando valor. Inclui **tudo**: Backend, Frontend, Design, Deploy, Infraestrutura, e todas as áreas do produto.

---

## 📋 Visão Geral

### Ideia e Problema
- **Produto**: Plataforma SaaS de governança e modelagem de processos ("GitHub de processos")
- **Stack**: Editor BPMN + Copilot de IA + Versionamento + Colaboração + Rastreabilidade
- **Problema**: Consultorias e Áreas internas de mapeamento de processos entregam "foto/fluxograma" estático sem histórico, aprovação, rastreabilidade nem atualização contínua

### Visão Final (Estado Alvo)
- Repositório vivo de processos com estados (rascunho, revisão, ativo, obsoleto), donos, SLA, riscos
- Copilot de processos: ingestão inteligente, geração e edição conversacional, insights automáticos
- Git de processos: versionamento completo, diff visual, branches/ambientes, aprovação/merge
- Rastreabilidade e compliance: evidências vinculadas, trilha de auditoria, relatórios (ISO/SOX/LGPD)
- UX enterprise: editor BPMN avançado, comentários ancorados, visões por papel/sistema/risco
- Integrações: SSO, Slack/Teams, Jira/ServiceNow/ERP/CRM, webhooks e API pública

---

## 🗺️ Estrutura do Roadmap

O roadmap está organizado em **5 Fases**, cada uma dividida em **Sprints**:

| Fase | Duração | Objetivo Principal | Sprints |
|------|---------|-------------------|---------|
| **Fase 1** | 2-3 meses | MVP interno para consultoria | S1, S2, S2.5, S3 |
| **Fase 2** | 3-4 meses | Repositório + Versionamento + Governança | S4, S5, S6 |
| **Fase 3** | 3-4 meses | Colaboração, Comentários, Aprovação | S7, S8, S9 |
| **Fase 4** | 4-6 meses | Rastreabilidade, RAG real, Relatórios | S10, S11, S12 |
| **Fase 5** | 6-12 meses | Enterprise: Escala, Segurança, Integrações | S13, S14, S15 |

---

## 🚀 Fase 1 - MVP Interno para Consultoria

**Duração**: 2-3 meses  
**Objetivo**: Consultores usam para mapear processos com IA e guardar versões básicas  
**Status**: ✅ Concluído

### Sprint 1 - Fundação de Código ✅
**Status**: Concluído (Novembro 2025)

**Backend**:
- ✅ Estrutura do monorepo estabelecida
- ✅ Modelos de banco de dados criados (`Organization`, `Project`, `ProcessModel`, `ModelVersion`, `Artifact`, `EmbeddingChunk`, `AuditEntry`, `User`)
- ✅ Alembic configurado para migrações
- ✅ Esqueleto da API FastAPI

**Frontend**:
- ✅ Estrutura Next.js estabelecida
- ✅ Esqueleto do frontend com placeholder do Studio

**Infraestrutura**:
- ✅ Docker Compose básico (db, api, web, minio)

**Documentação**:
- ✅ Documentação base criada

---

### Sprint 2 - Ingestão e RAG ✅
**Status**: Concluído (Novembro 2025)

**Backend**:
- ✅ Pipeline de ingestão implementado (PDF, DOCX, TXT, Imagens)
- ✅ MinIO integrado para storage
- ✅ Worker assíncrono (Celery)
- ✅ Sistema RAG básico com pgvector
- ✅ Endpoints `/ingest` e `/search`

**Infraestrutura**:
- ✅ MinIO configurado e funcional
- ✅ Celery workers configurados

---

### Sprint 3 - Hardening, Auth & UI de Projetos ✅
**Status**: Concluído (Dezembro 2025)

**Backend**:
- ✅ Logging estruturado em JSON com `request_id`
- ✅ Tratamento de erros centralizado e padronizado
- ✅ BYOK Security: Filtros para garantir que API keys nunca apareçam nos logs
- ✅ Health checks robustos (DB + MinIO)
- ✅ Sistema completo de Auth (JWT, Password Hashing)
- ✅ Endpoints: Login, Register (com criação de Org), Me
- ✅ Controle de acesso por Organização (Multi-tenancy básico)

**Frontend**:
- ✅ AuthContext, ProtectedRoute, Login/Register Pages
- ✅ Dashboard com listagem de projetos
- ✅ Criação de novos projetos
- ✅ Listagem de processos por projeto
- ✅ Navegação fluida: Dashboard → Projeto → Processo → Studio
- ✅ Studio carrega processos existentes (`?process_id`)
- ✅ Integração com backend para salvar/gerar versões
- ✅ Seletor de versões e ativação de versão
- ✅ Breadcrumbs de navegação

**Infraestrutura**:
- ✅ Docker Compose estável (db, api, web, minio)

---

### Sprint 2.5 - Design System & UI/UX para Conversão ✅
**Status**: Concluído (Dezembro 2025)

**Design**:
- ✅ Design System completo com tokens de design (cores, tipografia, espaçamento)
- ✅ Componentes base reutilizáveis: Button, Input, Card, Badge, Label, Alert, Toast, EmptyState, Textarea
- ✅ Layout Shell com Sidebar responsiva e Navbar unificada
- ✅ Empty States padronizados e atrativos
- ✅ Navegação intuitiva com breadcrumbs dinâmicos
- ✅ Responsividade mobile completa (menu hambúrguer, sidebar overlay)
- ✅ Polimento visual: animações sutis, transições suaves, focus rings, sombras consistentes
- ✅ Acessibilidade melhorada: navegação por teclado, focus visible, ARIA labels

**Frontend**:
- ✅ Páginas refatoradas: Dashboard, Catalog, Login, Register, Projects (lista e novo)
- ✅ Componentes criados e documentados

**Páginas Implementadas**:
- ✅ Landing Page (`/`) - estrutura básica
- ✅ Login (`/login`)
- ✅ Register (`/register`)
- ✅ Dashboard (`/dashboard`)
- ✅ Catálogo de Projetos (`/projects`)
- ✅ Criar Novo Projeto (`/projects/new`)
- ✅ Detalhes do Projeto (`/projects/[id]`)
- ✅ Editor BPMN (`/studio`)
- ✅ Onboarding (`/onboarding`)

---

## 🔄 Fase 2 - Repositório + Versionamento Real + Governança

**Duração**: 3-4 meses  
**Objetivo**: Virar "Git de processos" inicial com governança básica  
**Status**: 🟡 Em Andamento (~60% concluído)

### Sprint 4 - Versionamento Real ✅
**Status**: Concluído (Dezembro 2025)

**Backend**:
- ✅ Endpoint para criar nova versão (`POST /versions`) com mensagem de commit
- ✅ Endpoint de listagem de histórico (`GET /versions`)
- ✅ Endpoint de ativação de versão (`PUT /activate`)
- ✅ Endpoint de diff textual (`GET /diff`)
- ✅ Schema `VersionDiffResponse` no backend

**Frontend**:
- ✅ UI de Histórico de Versões (Timeline Component)
- ✅ Modal de "Save New Version" com metadados (commit, change type)
- ✅ Integração completa no StudioPage

**Páginas Implementadas**:
- ✅ Histórico de Versões (`/processes/[id]/versions`)

---

### Sprint 5 - UI de Versionamento Avançado ✅
**Status**: Concluído (Dezembro 2025)

**Backend**:
- ✅ Endpoint de diff aprimorado

**Frontend**:
- ✅ Componente `VersionDiffViewer` para comparação visual de versões
- ✅ Integração com `bpmn-js-differ` para cálculo de diferenças semânticas
- ✅ Visualização lado a lado com highlights (vermelho=removido, verde=adicionado, amarelo=modificado)
- ✅ Catálogo de Processos com filtros avançados (status, dono, projeto, busca)
- ✅ Funcionalidade de reverter/restore para versão anterior

**Páginas Implementadas**:
- ✅ Comparar Versões (`/processes/[id]/compare`)
- ✅ Catálogo de Processos (`/catalog`)
- ✅ Página do Processo (`/processes/[id]`)

---

### Sprint 6 - Governança e Segurança Organizacional 🔄
**Status**: Em Andamento (Dezembro 2025)

**Backend**:
- [ ] **Optimistic Locking**: Adicionar `version_timestamp`/`etag` em versões; endpoint de save retorna 409 Conflict se base mudou
- [ ] **Sistema de Convites**: Modelo `Invitation` com token, email, role, expires_at; endpoints de criar/aceitar convite
- [ ] **Audit Log do Sistema**: Registro imutável de ações administrativas (criação/remoção usuários, mudanças permissão, exportações massa)
- [ ] **Gestão de API Keys**: Modelo `ApiKey` para BYOK LLM e chaves de integração; rotação e revogação
- [ ] **Separação estrita de dados**: Row Level Security aprimorado
- [ ] **Papéis avançados**: Viewer, Editor, Reviewer, Admin com permissões granulares

**Frontend**:
- [ ] **Modal de Conflito de Edição**: Detecta 409 Conflict, exibe opções (sobrescrever/salvar como cópia/mesclar)
- [x] **Rota `/invite/[token]`**: Aceite de convite, definição de senha
- [ ] **Rota `/settings/audit-log`**: Tabela de eventos administrativos com filtros e exportação
- [ ] **Rota `/settings/api-keys`**: Gestão de chaves BYOK e API
- [ ] **Páginas de Erro**: `/403`, `/404`, `/500` com mensagens amigáveis

**Design**:
- [ ] Design das novas páginas de governança
- [ ] Modal de conflito de edição
- [ ] Páginas de erro amigáveis

**Páginas a Implementar**:
- [x] Aceite de Convite (`/invite/[token]`)
- [ ] Audit Log (`/settings/audit-log`)
- [ ] Gestão de API Keys (`/settings/api-keys`)
- [ ] Acesso Negado (`/403`)
- [ ] Não Encontrado (`/404`)
- [ ] Erro do Servidor (`/500`)

---

### Sprint 2.6 - Design Visual & Branding 🔮
**Status**: Recomendado (Antes do Sprint 6)

**Design Visual**:
- [ ] **Identidade Visual**: Logo principal (horizontal, vertical, favicon), paleta de cores expandida, tipografia completa
- [ ] **Landing Page Completa**: Hero section com imagens/ilustrações, features section, casos de uso, footer completo
- [ ] **Assets Visuais**: Ilustrações para empty states, screenshots do produto, ícones customizados
- [ ] **Layouts Detalhados**: Todas as páginas principais em alta fidelidade (desktop/tablet/mobile)

**Entrega**:
- [ ] Design System no Figma (componentes documentados)
- [ ] Assets exportados (logos, ícones, ilustrações, fotos)
- [ ] Guia de marca (uso do logo, cores, tipografia)
- [ ] Especificações técnicas (espaçamentos, tamanhos, cores)

---

## 👥 Fase 3 - Colaboração, Comentários, Aprovação

**Duração**: 3-4 meses  
**Objetivo**: Pull requests de processo, comentários ancorados e approvals  
**Status**: 🔮 Planejado

### Sprint 7 - Comentários Ancorados 🔮
**Status**: Planejado

**Backend**:
- [ ] Modelo `Comment` (ancorado em elemento/versão)
- [ ] Endpoints: criar, listar, resolver comentários
- [ ] Threads de discussão

**Frontend**:
- [ ] Comentários inline no diagrama
- [ ] Threads de discussão
- [ ] Marcar como resolvido
- [ ] UI de comentários no editor

**Design**:
- [ ] Design de comentários ancorados
- [ ] Threads visuais
- [ ] Indicadores de comentários no diagrama

**Páginas a Implementar**:
- [ ] Comentários no Editor (melhoria no `/studio`)

---

### Sprint 8 - Review/Approval Flow 🔮
**Status**: Planejado

**Backend**:
- [ ] Modelo `ReviewRequest` (proposta -> revisão -> aprovação)
- [ ] Endpoints: criar proposta, revisar, aprovar, promover para ativa
- [ ] Fluxo de aprovação completo

**Frontend**:
- [ ] Fluxo de aprovação visual
- [ ] Lista de mudanças pendentes
- [ ] Interface de review

**Design**:
- [ ] Design do fluxo de aprovação
- [ ] Cards de review
- [ ] Interface de comparação para review

**Páginas a Implementar**:
- [ ] Reviews Pendentes (`/reviews`)
- [ ] Detalhes do Review (`/reviews/[id]`)

---

### Sprint 9 - Notificações e Lixeira 🔮
**Status**: Planejado

**Backend**:
- [ ] **Lixeira/Soft Delete**: Endpoints de restaurar/excluir permanentemente; exclusão automática após período de retenção
- [ ] Sistema de notificações (email/Slack/Teams)
- [ ] Permissões por papel reforçadas

**Frontend**:
- [ ] Interface de lixeira
- [ ] Notificações em tempo real
- [ ] Integração com canais externos

**Design**:
- [ ] Design da lixeira
- [ ] Empty states para lixeira
- [ ] UI de notificações

**Integrações**:
- [ ] Notificações (email/Slack/Teams) para comentários e approvals

**Páginas a Implementar**:
- [ ] Lixeira (`/trash`)

---

## 📊 Fase 4 - Rastreabilidade, RAG Real, Relatórios

**Duração**: 4-6 meses  
**Objetivo**: Evidências claras e IA sustentada por documentos reais  
**Status**: 🔮 Planejado

### Sprint 10 - Ingest RAG Real + Evidências 🔮
**Status**: Planejado

**Backend / IA**:
- [ ] Ingestão robusta (PDF, DOCX, imagens com OCR), indexação em `EmbeddingChunk`
- [ ] RAG integrado ao pipeline de geração/edição
- [ ] Registrar artefatos/trechos usados por versão
- [ ] Binding de evidências a versões

**Frontend**:
- [ ] Tela de evidências: listar docs/trechos usados por versão e por elemento do processo
- [ ] Filtros e links por elemento

**Design**:
- [ ] Design da tela de evidências
- [ ] Visualização de trechos destacados
- [ ] Links para elementos do BPMN

**Páginas a Implementar**:
- [ ] Evidências do Processo (`/processes/[id]/evidence`)

---

### Sprint 11 - UI de Evidências Avançada 🔮
**Status**: Planejado

**Frontend**:
- [ ] Visualizações por risco/criticidade
- [ ] Preview de documentos
- [ ] Highlights de trechos

**Design**:
- [ ] Visualizações avançadas
- [ ] Gráficos de risco/criticidade

---

### Sprint 12 - Relatórios Automáticos 🔮
**Status**: Planejado

**Backend**:
- [ ] Geração de POPs/manuais/resumos executivos a partir dos modelos
- [ ] Relatórios de conformidade (quem mudou, baseado em que, aprovado por quem)
- [ ] Exportação de evidências por versão (JSON/relatórios)

**Frontend**:
- [ ] Interface de geração de relatórios
- [ ] Preview e download (PDF/DOCX)

**Design**:
- [ ] Design dos relatórios
- [ ] Templates de relatórios

**Páginas a Implementar**:
- [ ] Relatórios (`/reports`)
- [ ] Gerar Relatório (`/reports/[type]`)

---

## 🏢 Fase 5 - Enterprise

**Duração**: 6-12 meses  
**Objetivo**: Escala, segurança, extensões setoriais e integrações profundas  
**Status**: 🔮 Planejado

### Sprint 13 - SSO + RBAC Avançado 🔮
**Status**: Planejado

**Backend**:
- [ ] SSO (SAML/OIDC)
- [ ] RBAC avançado
- [ ] Políticas de retenção
- [ ] Trilha de auditoria completa

**Frontend**:
- [ ] Interface de SSO
- [ ] Gestão de permissões avançada

**Design**:
- [ ] Design das configurações de SSO
- [ ] UI de gestão de permissões

**Páginas a Implementar**:
- [ ] Configurações da Organização (`/settings/organization`)
- [ ] Integrações (`/settings/integrations`)

---

### Sprint 14 - Hardening de Escala + Monitoramento 🔮
**Status**: Planejado

**Backend**:
- [ ] Multi-tenant com isolamento forte
- [ ] Jobs assíncronos para ingest/IA pesada
- [ ] Observabilidade avançada (tracing, métricas, alertas)
- [ ] Tuning de DB/search

**Frontend**:
- [ ] Dashboard de uso: consumo de IA tokens, armazenamento, membros
- [ ] Gráficos e alertas de quota

**Infraestrutura**:
- [ ] Workers e filas otimizadas
- [ ] Métricas e alertas (Prometheus/Grafana)

**Design**:
- [ ] Design do dashboard de uso
- [ ] Gráficos e visualizações

**Páginas a Implementar**:
- [ ] Monitoramento de Uso (`/settings/usage`)

---

### Sprint 15 - Conectores Enterprise + UX Avançada + Billing 🔮
**Status**: Planejado

**Backend**:
- [ ] Conectores com Jira/ServiceNow/ERP/CRM
- [ ] Webhooks
- [ ] API pública
- [ ] Integração com sistema de billing

**Frontend**:
- [ ] Evolução do design system: paletas por setor, visões por papel/sistema/risco
- [ ] Comentários e filtros avançados
- [ ] Modos macro/microprocesso
- [ ] UX enterprise: temas customizáveis por organização, dashboards executivos
- [ ] Interface de billing

**Design**:
- [ ] Paletas setoriais
- [ ] Visões avançadas
- [ ] Dashboards executivos
- [ ] Design de billing

**Páginas a Implementar**:
- [ ] Pricing (`/pricing`)
- [ ] Solução (`/solucao`)
- [ ] Documentação (`/docs`)
- [ ] Faturamento (`/settings/billing`)
- [ ] Manutenção (`/maintenance`)

---

## 📝 Notas Técnicas Importantes

### Arquitetura
- **JSON-first**: Manter BPMN_JSON como fonte de verdade; converter para XML só em bordas (import/export/render)
- **Editor plugável**: Tratar bpmn.io como motor de desenho; contrato de entrada/saída é o JSON + eventos de edição (patch ops)
- **IA/copilot**: Operar sobre JSON e patch ops; nunca acoplar a UI. Registrar evidências usadas (artefatos, trechos) em cada versão
- **Versionamento**: Cada alteração gera `ModelVersion` com diffs, autor, mensagem de commit; fluxo de aprovação promove versões

### Segurança
- **BYOK**: Chaves de LLM nunca logadas/persistidas; escopo por organização; logging sem dados sensíveis
- **Multi-tenancy**: Isolamento estrito por organização; Row Level Security
- **RBAC**: Papéis granulares (Viewer, Editor, Reviewer, Admin)

### Observabilidade
- **Request ID**: Rastreabilidade total com `request_id`
- **Logs estruturados**: JSON logs com contexto completo
- **Métricas**: Performance (tempo de ingest, geração, lint)
- **Tracing**: Pipeline de geração/edição/RAG

### Ingestão Multimodal
- **Suporte**: PDF/DOCX/imagem (OCR) e áudio/vídeo via transcrição (ASR)
- **Metadados**: Timestamps, páginas, tipo de artefato
- **Evidências**: Referenciar trechos (timestamp) como evidências em versões/processos

---

## 🎯 Métricas de Sucesso por Fase

### Fase 1 (MVP)
- ✅ Sistema funcional end-to-end
- ✅ Consultores conseguem mapear processos com IA
- ✅ Versões básicas funcionando

### Fase 2 (Versionamento + Governança)
- Catálogo de processos funcional
- Diff visual implementado
- Sistema de convites operacional
- Audit log completo

### Fase 3 (Colaboração)
- Comentários ancorados funcionando
- Fluxo de aprovação completo
- Notificações operacionais

### Fase 4 (Rastreabilidade)
- Evidências vinculadas a versões
- RAG robusto com grounding
- Relatórios automáticos gerados

### Fase 5 (Enterprise)
- SSO implementado
- Integrações funcionando
- Escala para múltiplos clientes
- Billing operacional

---

## 🔗 Referências

- [PRD](PRD.md) - Product Requirements Document
- [Arquitetura de Páginas](app_pages.md) - Detalhamento de todas as páginas
- [Arquitetura de Código](code_architecture.md) - Estrutura técnica
- [Regras de Desenvolvimento](rules.md) - Padrões e boas práticas

---

**Última atualização**: Dezembro de 2025

