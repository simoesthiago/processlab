# ProcessLab - Roadmap

**Última atualização**: Dezembro de 2025

Este documento define o roadmap do ProcessLab, focado em **armazenamento/gestão de processos** e **studio/canvas com IA generativa**.

---

## 📋 Visão Geral

### Ideia e Problema
- **Produto**: Plataforma SaaS de modelagem de processos com editor BPMN e copilot de IA generativa
- **Stack**: Editor BPMN + Copilot de IA + Armazenamento Hierárquico + Versionamento Básico
- **Problema**: Consultorias e áreas internas de mapeamento de processos precisam de uma ferramenta moderna para criar, organizar e gerenciar processos de negócio com apoio de IA

### Visão Final (Estado Alvo)
- Hierarquia perfeita: Workspace → Project → Folder → Process funcionando de forma intuitiva
- Studio/canvas avançado: Editor BPMN completo com IA generativa integrada
- Versionamento básico: Salvar e restaurar versões anteriores (sem diff visual, sem aprovação)
- IA robusta: Geração e edição conversacional de processos com alta qualidade
- Export completo: XML, PNG, PDF, JSON

---

## 🗺️ Estrutura do Roadmap

O roadmap está organizado em **3 Fases**:

| Fase | Duração | Objetivo Principal | Status |
|------|---------|-------------------|--------|
| **Fase 1** | 2-3 meses | MVP: Editor + IA básica + Hierarquia básica | ✅ Concluído |
| **Fase 2** | 2-3 meses | Hierarquia completa + Studio polido + IA melhorada | 🟡 Em Andamento |
| **Fase 3** | 2-3 meses | Escala, Performance, UX refinada | 🔮 Planejado |

---

## 🚀 Fase 1 - MVP

**Duração**: 2-3 meses  
**Objetivo**: Sistema funcional com editor BPMN, IA básica e hierarquia básica  
**Status**: ✅ Concluído

### Sprint 1 - Fundação de Código ✅
**Status**: Concluído (Novembro 2025)

**Backend**:
- ✅ Estrutura do monorepo estabelecida
- ✅ Modelos de banco de dados criados (`Organization`, `Project`, `ProcessModel`, `ModelVersion`, `Artifact`, `EmbeddingChunk`, `User`)
- ✅ Alembic configurado para migrações
- ✅ Esqueleto da API FastAPI

**Frontend**:
- ✅ Estrutura Next.js estabelecida
- ✅ Esqueleto do frontend com placeholder do Studio

**Infraestrutura**:
- ✅ Docker Compose básico (db, api, web, minio)

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

### Sprint 2.5 - Design System & UI/UX ✅
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
- ✅ Landing Page (`/`)
- ✅ Login (`/login`)
- ✅ Register (`/register`)
- ✅ Dashboard (`/dashboard`)
- ✅ Catálogo de Projetos (`/projects`)
- ✅ Criar Novo Projeto (`/projects/new`)
- ✅ Detalhes do Projeto (`/projects/[id]`)
- ✅ Editor BPMN (`/studio`)

---

### Sprint 2.6 - Design Visual & Branding ✅
**Status**: Concluído (Dezembro 2025)

**Design Visual**:
- ✅ Identidade Visual: Logo principal (horizontal, vertical, favicon)
- ✅ Paleta de cores expandida
- ✅ Tipografia completa
- ✅ Landing Page Completa: Hero section, features section, casos de uso, footer
- ✅ Assets Visuais: Ilustrações para empty states
- ✅ Layouts e Componentes atualizados

---

## 🔄 Fase 2 - Hierarquia Completa + Studio Polido + IA Melhorada

**Duração**: 2-3 meses  
**Objetivo**: Hierarquia workspace/folder/process funcionando perfeitamente + Studio/canvas polido com IA melhorada  
**Status**: 🟡 Em Andamento

### Sprint 4 - Hierarquia Workspace/Folder/Process ✅
**Status**: Concluído (Dezembro 2025)

**Backend**:
- ✅ Modelo `Folder` com hierarquia (subfolders)
- ✅ Endpoints de CRUD para folders
- ✅ Endpoints de hierarquia (árvore completa)
- ✅ Processos podem pertencer a folders ou diretamente a projetos
- ✅ Ordenação por posição

**Frontend**:
- ✅ Visualização em árvore da hierarquia
- ✅ Criação/edição de folders
- ✅ Navegação por hierarquia
- ✅ Drag & drop para reorganizar (parcial)

**Páginas Implementadas**:
- ✅ Workspace view com hierarquia
- ✅ Folder management

---

### Sprint 5 - Versionamento Básico ✅
**Status**: Concluído (Dezembro 2025)

**Backend**:
- ✅ Endpoint para criar nova versão (`POST /versions`) com mensagem de commit
- ✅ Endpoint de listagem de histórico (`GET /versions`)
- ✅ Endpoint de ativação de versão (`PUT /activate`)
- ✅ Histórico simples (sem diff visual)

**Frontend**:
- ✅ UI de Histórico de Versões (Timeline Component)
- ✅ Modal de "Save New Version" com metadados (commit, change type)
- ✅ Integração completa no StudioPage
- ✅ Restaurar versão anterior

**Páginas Implementadas**:
- ✅ Histórico de Versões (`/processes/[id]/versions`)

**Nota**: Diff visual, comparação lado a lado e branches **NÃO** são necessários.

---

### Sprint 6 - Studio/Canvas Polido 🔄
**Status**: Em Andamento (Dezembro 2025)

**Backend**:
- ✅ Endpoints de export (XML, PNG, PDF, JSON)
- 🔄 Melhorias no auto-layout (ELK.js)
- 🔄 Validação de BPMN (lint)

**Frontend**:
- ✅ Editor BPMN funcional (bpmn-js)
- ✅ Integração com IA (geração/edição)
- 🔄 Melhorias na UX do editor
- 🔄 Auto-layout refinado
- 🔄 Export em múltiplos formatos
- 🔄 Download de diagramas

**Melhorias Planejadas**:
- [ ] Refinamento do auto-layout
- [ ] Melhorias na UX de edição
- [ ] Export avançado (PNG/PDF de alta qualidade)
- [ ] Atalhos de teclado
- [ ] Zoom e pan otimizados

**Funcionalidades Identificadas (Implementadas mas não conectadas)**:
- [ ] **FormatToolbar**: Conectar formatação (Font, Size, Bold, Italic, Underline, Text Color, Fill Color) com elementos BPMN
- [ ] **FormatToolbar**: Implementar Arrange (bring to front, send to back, group, ungroup)
- [ ] **FormatToolbar**: Implementar Search (buscar elementos no canvas)
- [ ] **FormatToolbar**: Implementar History (histórico de ações no editor)
- [ ] **FormatToolbar**: Implementar alinhamento horizontal e vertical
- [ ] **StudioNavbar**: Implementar Undo/Redo (integração com bpmn-js)
- [ ] **StudioNavbar**: Implementar seletor de idioma (i18n completo)
- [ ] **StudioNavbar**: Implementar Settings (configurações do editor)
- [ ] **ElementsSidebar**: Implementar ferramentas (Resize/Move, Align, Connector)
- [ ] **ElementsSidebar**: Melhorar drag & drop de elementos BPMN
- [ ] **Copilot**: Melhorar histórico de mensagens (persistência)
- [ ] **Copilot**: Preview de mudanças antes de aplicar
- [ ] **Citations**: Implementar painel completo com links para documentos

---

### Sprint 7 - IA Generativa Melhorada 🔮
**Status**: Planejado

**Backend / IA**:
- [ ] Melhorias no pipeline de geração
- [ ] RAG mais robusto (melhor contexto dos documentos)
- [ ] Edição conversacional aprimorada
- [ ] Validação pós-geração (lint automático)
- [ ] Sugestões inteligentes durante edição

**Frontend**:
- [ ] UI melhorada para geração de processos
- [ ] Feedback visual durante geração
- [ ] Preview de sugestões
- [ ] Histórico de comandos de IA

**Melhorias Planejadas**:
- [ ] Geração mais rápida (P95 < 30s)
- [ ] Melhor qualidade dos processos gerados
- [ ] Suporte a múltiplos documentos simultâneos
- [ ] Edição conversacional mais natural

---

## 🚀 Fase 3 - Escala, Performance, UX Refinada

**Duração**: 2-3 meses  
**Objetivo**: Sistema escalável, performático e com UX refinada  
**Status**: 🔮 Planejado

### Sprint 8 - Performance e Escala 🔮
**Status**: Planejado

**Backend**:
- [ ] Otimização de queries (hierarquia, listagens)
- [ ] Cache de embeddings e layouts
- [ ] Workers otimizados para IA
- [ ] Pooling de DB melhorado
- [ ] Métricas e monitoramento básico

**Frontend**:
- [ ] Lazy loading de componentes
- [ ] Virtualização de listas grandes
- [ ] Cache de processos abertos
- [ ] Otimização de re-renders

**Infraestrutura**:
- [ ] Escalabilidade horizontal
- [ ] Load balancing
- [ ] CDN para assets estáticos

---

### Sprint 9 - UX Refinada e Polimento 🔮
**Status**: Planejado

**Frontend**:
- [ ] Onboarding melhorado
- [ ] Tutoriais interativos
- [ ] Feedback visual aprimorado
- [ ] Animações e transições polidas
- [ ] Acessibilidade completa (WCAG 2.1)

**Design**:
- [ ] Refinamento do design system
- [ ] Micro-interações
- [ ] Estados de loading otimizados
- [ ] Mensagens de erro mais claras

---

## 📝 Notas Técnicas Importantes

### Arquitetura
- **JSON-first**: Manter BPMN_JSON como fonte de verdade; converter para XML só em import/export/render
- **Editor plugável**: Tratar bpmn.io como motor de desenho; contrato de entrada/saída é o JSON + eventos de edição
- **IA/copilot**: Operar sobre JSON; nunca acoplar a UI
- **Versionamento**: Cada alteração gera `ModelVersion` com mensagem de commit; histórico simples (sem diff visual)

### Hierarquia
- **Workspace** (Organization/Personal) → **Project** → **Folder** (hierárquico, opcional) → **Process** → **Version**
- Folders podem ter subfolders (hierarquia aninhada)
- Processos podem estar em folders ou diretamente em projetos

### Segurança
- **Multi-tenancy**: Isolamento estrito por organização; Row Level Security
- **Auth**: JWT, password hashing
- **Logs**: Nunca logar dados sensíveis

### Observabilidade
- **Request ID**: Rastreabilidade total com `request_id`
- **Logs estruturados**: JSON logs com contexto completo
- **Métricas**: Performance (tempo de ingest, geração, lint)

---

## 🎯 Métricas de Sucesso

### Fase 1 (MVP)
- ✅ Sistema funcional end-to-end
- ✅ Consultores conseguem mapear processos com IA
- ✅ Versões básicas funcionando

### Fase 2 (Hierarquia + Studio + IA)
- Hierarquia workspace/folder/process funcionando perfeitamente
- Studio/canvas polido e intuitivo
- IA gerando processos de alta qualidade
- Export em múltiplos formatos funcionando

### Fase 3 (Escala + Performance)
- Performance: Geração P95 < 30s
- Escalabilidade: Suporte a múltiplas organizações
- UX: Satisfação do usuário alta
- Adoção: Processos criados por usuário aumentando

---

## ❌ Funcionalidades Removidas (Não no Escopo)

As seguintes funcionalidades **NÃO** serão implementadas:

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
- ❌ Branches/merge de versões
- ❌ Comparação lado a lado de versões

---

## 🔗 Referências

- [PRD](PRD.md) - Product Requirements Document
- [Arquitetura de Páginas](app_pages.md) - Detalhamento de todas as páginas
- [Arquitetura de Código](code_architecture.md) - Estrutura técnica
- [Regras de Desenvolvimento](rules.md) - Padrões e boas práticas

---

**Última atualização**: Dezembro de 2025
