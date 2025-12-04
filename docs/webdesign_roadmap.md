# ProcessLab - Roadmap de Web Design por Página

**Última atualização**: Dezembro de 2025

Este documento mapeia todas as páginas do ProcessLab e suas respectivas fases/sprints de implementação de web design, organizadas cronologicamente.

---

## 📅 Visão Geral por Fase

| Fase | Sprint | Páginas | Status |
|------|--------|---------|--------|
| **Fase 1** | Sprint 2.5 | Landing, Login, Register, Dashboard, Projetos, Studio, Onboarding | ✅ Concluído |
| **Fase 1** | Sprint 3 | Dashboard, Projetos (refinamento) | ✅ Concluído |
| **Fase 2** | Sprint 4-5 | Catálogo, Processos, Versões, Compare | ✅ Concluído |
| **Fase 2** | Sprint 6 | Convites, Audit Log, API Keys, Páginas de Erro | 🔮 Planejado |
| **Fase 3** | Sprint 7-9 | Reviews, Lixeira, Comentários | 🔮 Planejado |
| **Fase 4** | Sprint 10-12 | Evidências, Relatórios | 🔮 Planejado |
| **Fase 5** | Sprint 13-15 | Pricing, Solução, Settings Avançados, Monitoramento | 🔮 Planejado |

---

## 🎨 Sprint 2.5 - Design System & UI/UX (Fase 1) ✅

**Status**: Concluído (Dezembro 2025)  
**Objetivo**: Criar design system completo e aplicar nas páginas MVP

### Páginas Implementadas

#### Páginas Públicas
- ✅ **Landing Page** (`/`)
  - Hero section, features, CTAs
  - Design system aplicado
  
- ✅ **Login** (`/login`)
  - Formulário de autenticação
  - Design system aplicado
  
- ✅ **Register** (`/register`)
  - Formulário de registro
  - Design system aplicado

#### Páginas Autenticadas
- ✅ **Dashboard** (`/dashboard`)
  - Cards de resumo, listas recentes
  - Design system aplicado
  
- ✅ **Catálogo de Projetos** (`/projects`)
  - Grid/lista de projetos
  - Design system aplicado
  
- ✅ **Criar Novo Projeto** (`/projects/new`)
  - Formulário de criação
  - Design system aplicado
  
- ✅ **Detalhes do Projeto** (`/projects/[id]`)
  - Tabs, estatísticas
  - Design system aplicado
  
- ✅ **Editor BPMN** (`/studio`)
  - Layout split (editor + copilot)
  - Design system aplicado
  
- ✅ **Onboarding** (`/onboarding`)
  - Tour interativo
  - Design system aplicado

**Componentes Criados**:
- Button, Input, Card, Badge, Label, Alert, Toast, EmptyState, Textarea
- Sidebar, Navbar, AppLayout

---

## 🔄 Sprint 4 - Versionamento Real (Fase 2) ✅

**Status**: Concluído (Dezembro 2025)

### Páginas Implementadas

- ✅ **Histórico de Versões** (`/processes/[id]/versions`)
  - Timeline vertical de versões
  - Filtros e busca
  
- ✅ **Comparar Versões** (`/processes/[id]/compare`)
  - Visualização lado a lado
  - Highlights de diferenças (bpmn-js-differ)

---

## 🎯 Sprint 5 - UI de Versionamento Avançado (Fase 2) ✅

**Status**: Concluído (Dezembro 2025)

### Páginas Implementadas

- ✅ **Catálogo de Processos** (`/catalog`)
  - Filtros avançados (status, dono, projeto, busca)
  - Grid de processos
  
- ✅ **Página do Processo** (`/processes/[id]`)
  - Tabs: Diagrama, Versões, Evidências, Comentários, Reviews
  - Preview do BPMN (read-only)

---

## 🔐 Sprint 6 - Governança e Segurança (Fase 2) 🔮

**Status**: Planejado (Dezembro 2025 - Janeiro 2026)

### Páginas a Implementar

#### Páginas Públicas
- [ ] **Aceite de Convite** (`/invite/[token]`)
  - Formulário de definição de senha
  - Validação de token
  - Informações da organização

#### Páginas de Erro
- [ ] **Acesso Negado** (`/403`)
  - Mensagem amigável
  - Link para contato do admin
  
- [ ] **Não Encontrado** (`/404`)
  - Mensagem amigável
  - Sugestões de navegação
  
- [ ] **Erro do Servidor** (`/500`)
  - Mensagem amigável
  - Ações de recuperação

#### Settings (Admin)
- [ ] **Audit Log** (`/settings/audit-log`)
  - Tabela de eventos administrativos
  - Filtros (tipo, usuário, período)
  - Exportação CSV/JSON
  
- [ ] **Gestão de API Keys** (`/settings/api-keys`)
  - Lista de chaves (mascaradas)
  - Criar, rotar, revogar
  - Logs de uso

#### Editor (Melhorias)
- [ ] **Modal de Conflito de Edição** (no `/studio`)
  - Detecção de 409 Conflict
  - Opções: Sobrescrever, Salvar como Cópia, Mesclar
  - Diff visual antes de salvar

---

## 👥 Sprint 7-9 - Colaboração (Fase 3) 🔮

**Status**: Planejado (Fase 3)

### Páginas a Implementar

- [ ] **Reviews Pendentes** (`/reviews`)
  - Lista de propostas de mudança
  - Filtros (status, processo, autor)
  - Cards de review
  
- [ ] **Detalhes do Review** (`/reviews/[id]`)
  - Diff visual lado a lado
  - Threads de comentários
  - Ações: Aprovar, Rejeitar, Solicitar Mudanças
  
- [ ] **Lixeira** (`/trash`)
  - Lista de processos/projetos deletados
  - Filtros (tipo, data, deletado por)
  - Ações: Restaurar, Excluir Permanentemente
  
- [ ] **Comentários no Editor** (melhoria no `/studio`)
  - Comentários ancorados em elementos
  - Threads de discussão
  - Marcar como resolvido

---

## 📊 Sprint 10-12 - Rastreabilidade (Fase 4) 🔮

**Status**: Planejado (Fase 4)

### Páginas a Implementar

- [ ] **Evidências do Processo** (`/processes/[id]/evidence`)
  - Lista de documentos/trechos por versão
  - Filtros (versão, tipo, elemento)
  - Preview de documentos
  - Links para elementos do BPMN
  
- [ ] **Relatórios** (`/reports`)
  - Tipos: POP, Resumo Executivo, Conformidade, Rastreabilidade
  - Formulário de geração
  - Preview e download (PDF/DOCX)
  
- [ ] **Gerar Relatório** (`/reports/[type]`)
  - Formulário específico por tipo
  - Opções de customização

---

## 🏢 Sprint 13-15 - Enterprise (Fase 5) 🔮

**Status**: Planejado (Fase 5)

### Páginas Públicas

- [ ] **Pricing** (`/pricing`)
  - Tabela de planos (Starter, Professional, Enterprise)
  - Features por plano
  - FAQ sobre preços
  - Comparação de planos
  
- [ ] **Solução** (`/solucao`)
  - Seções: Editor BPMN, IA/Copilot, Versionamento, Colaboração
  - Casos de uso por persona
  - Screenshots/demos
  - Comparação com alternativas
  
- [ ] **Documentação** (`/docs`)
  - Documentação técnica
  - Guias de uso
  - API reference
  
- [ ] **Manutenção** (`/maintenance`)
  - Página estática durante manutenção
  - Horário estimado de retorno

### Settings Avançados

- [ ] **Configurações da Organização** (`/settings/organization`)
  - Nome, domínio, membros
  - Gestão de convites
  - SSO (SAML/OIDC)
  
- [ ] **Monitoramento de Uso** (`/settings/usage`)
  - Dashboard de métricas (IA tokens, storage, membros)
  - Gráficos de tendência
  - Alertas de quota (80%, 90%, 100%)
  - Projeção de custos
  
- [ ] **Integrações** (`/settings/integrations`)
  - SSO (SAML/OIDC)
  - Slack, Teams
  - Jira, ServiceNow
  - Webhooks
  
- [ ] **Faturamento** (`/settings/billing`)
  - Plano atual
  - Métodos de pagamento
  - Histórico de faturas
  - Upgrade/Downgrade

### Melhorias em Páginas Existentes

- [ ] **Landing Page** (melhorias)
  - Depoimentos/testemunhos
  - Casos de sucesso
  
- [ ] **Dashboard** (melhorias)
  - Dashboards executivos
  - Gráficos avançados
  - Visões por papel/sistema/risco
  
- [ ] **Editor BPMN** (melhorias)
  - Paletas setoriais
  - Visões por papel/sistema/risco
  - Modos macro/microprocesso

---

## 📋 Resumo por Tipo de Página

### Páginas Públicas (Marketing)

| Página | Fase | Sprint | Status |
|--------|------|--------|--------|
| Landing (`/`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Login (`/login`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Register (`/register`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Convite (`/invite/[token]`) | Fase 2 | Sprint 6 | 🔮 Planejado |
| Pricing (`/pricing`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |
| Solução (`/solucao`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |
| Docs (`/docs`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |
| 403 (`/403`) | Fase 2 | Sprint 6 | 🔮 Planejado |
| 404 (`/404`) | Fase 2 | Sprint 6 | 🔮 Planejado |
| 500 (`/500`) | Fase 2 | Sprint 6 | 🔮 Planejado |
| Maintenance (`/maintenance`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |

### Páginas de Navegação Principal

| Página | Fase | Sprint | Status |
|--------|------|--------|--------|
| Dashboard (`/dashboard`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Projetos (`/projects`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Novo Projeto (`/projects/new`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Detalhes Projeto (`/projects/[id]`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Catálogo (`/catalog`) | Fase 2 | Sprint 5 | ✅ Concluído |
| Editor (`/studio`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Onboarding (`/onboarding`) | Fase 1 | Sprint 2.5 | ✅ Concluído |

### Páginas de Processos

| Página | Fase | Sprint | Status |
|--------|------|--------|--------|
| Processo (`/processes/[id]`) | Fase 2 | Sprint 5 | ✅ Concluído |
| Versões (`/processes/[id]/versions`) | Fase 2 | Sprint 4 | ✅ Concluído |
| Comparar (`/processes/[id]/compare`) | Fase 2 | Sprint 4 | ✅ Concluído |
| Evidências (`/processes/[id]/evidence`) | Fase 4 | Sprint 10-12 | 🔮 Planejado |

### Páginas de Colaboração

| Página | Fase | Sprint | Status |
|--------|------|--------|--------|
| Reviews (`/reviews`) | Fase 3 | Sprint 7-9 | 🔮 Planejado |
| Detalhes Review (`/reviews/[id]`) | Fase 3 | Sprint 7-9 | 🔮 Planejado |
| Lixeira (`/trash`) | Fase 3 | Sprint 7-9 | 🔮 Planejado |

### Páginas de Relatórios

| Página | Fase | Sprint | Status |
|--------|------|--------|--------|
| Relatórios (`/reports`) | Fase 4 | Sprint 10-12 | 🔮 Planejado |
| Gerar Relatório (`/reports/[type]`) | Fase 4 | Sprint 10-12 | 🔮 Planejado |

### Páginas de Configurações

| Página | Fase | Sprint | Status |
|--------|------|--------|--------|
| Settings (`/settings`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Perfil (`/settings/profile`) | Fase 1 | Sprint 2.5 | ✅ Concluído |
| Organização (`/settings/organization`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |
| Audit Log (`/settings/audit-log`) | Fase 2 | Sprint 6 | 🔮 Planejado |
| Uso (`/settings/usage`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |
| API Keys (`/settings/api-keys`) | Fase 2 | Sprint 6 | 🔮 Planejado |
| Integrações (`/settings/integrations`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |
| Billing (`/settings/billing`) | Fase 5 | Sprint 13-15 | 🔮 Planejado |

---

## 🎯 Prioridades de Design

### Alta Prioridade (Próximos Sprints)
1. **Sprint 6 (Fase 2)**: Convites, Audit Log, API Keys, Páginas de Erro
2. **Sprint 7-9 (Fase 3)**: Reviews, Lixeira, Comentários

### Média Prioridade
3. **Sprint 10-12 (Fase 4)**: Evidências, Relatórios

### Baixa Prioridade (Enterprise)
4. **Sprint 13-15 (Fase 5)**: Pricing, Solução, Settings Avançados, Monitoramento

---

## 📝 Notas de Design

### Design System
- ✅ **Sprint 2.5**: Design system completo criado e aplicado nas páginas MVP
- 🔄 **Ongoing**: Design system será expandido conforme novas páginas são criadas

### Responsividade
- ✅ **Mobile-First**: Todas as páginas implementadas seguem abordagem mobile-first
- ✅ **Breakpoints**: Mobile (< 768px), Tablet (768px - 1024px), Desktop (> 1024px)

### Acessibilidade
- ✅ **WCAG AA**: Contraste, navegação por teclado, ARIA labels
- 🔄 **Ongoing**: Melhorias contínuas de acessibilidade

### Componentes Reutilizáveis
- ✅ **Base**: Button, Input, Card, Badge, Label, Alert, Toast, EmptyState, Textarea
- 🔄 **Expansão**: Novos componentes serão criados conforme necessário

---

## 🔗 Referências

- [Arquitetura de Páginas](app_pages.md)
- [Roadmap Técnico](processlab_roadmap.md)
- [Progresso de Implementação](progresso_faseatual.md)

