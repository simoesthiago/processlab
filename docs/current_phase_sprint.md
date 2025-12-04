# ProcessLab - Fase Atual

**Última atualização**: Dezembro de 2025

Este documento foca **exclusivamente na fase atual** que está sendo implementada, monitorando o que já foi feito, o que falta fazer, e pendências de fases anteriores.

---

## 📍 Fase Atual: Fase 2 - Repositório + Versionamento Real + Governança

**Status**: 🟡 Em Andamento  
**Progresso**: ~75%  
**Duração Estimada**: 3-4 meses  
**Início**: Dezembro 2025  
**Previsão de Conclusão**: Março 2026

### Objetivo da Fase
Virar "Git de processos" inicial com governança básica. Implementar versionamento completo, catálogo de processos, sistema de convites, audit log, e funcionalidades críticas de governança para escalar como SaaS Enterprise.

---

## ✅ O Que Já Foi Feito (Fase 2)

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

**Páginas**:
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

**Páginas**:
- ✅ Comparar Versões (`/processes/[id]/compare`)
- ✅ Catálogo de Processos (`/catalog`)
- ✅ Página do Processo (`/processes/[id]`)

---

## 🔮 O Que Falta Fazer (Fase 2)

### Sprint 6 - Governança e Segurança Organizacional 🔮
**Status**: Planejado (Próximo Sprint)  
**Prioridade**: Alta  
**Estimativa**: 3-4 semanas

#### Backend - Pendente
- [ ] **Optimistic Locking**
  - Adicionar `version_timestamp`/`etag` em versões
  - Endpoint de save retorna 409 Conflict se base mudou
  - Validação de conflitos

- [ ] **Sistema de Convites**
  - Modelo `Invitation` com token, email, role, expires_at
  - Endpoint `POST /api/v1/organizations/[id]/invitations` (criar convite)
  - Endpoint `GET /api/v1/invitations/[token]` (validar token)
  - Endpoint `POST /api/v1/invitations/[token]/accept` (aceitar convite)
  - Geração de tokens seguros
  - Expiração de convites

- [ ] **Audit Log do Sistema**
  - Registro imutável de ações administrativas
  - Eventos: criação/remoção usuários, mudanças permissão, exportações massa
  - Endpoint `GET /api/v1/audit-log` com filtros
  - Endpoint `GET /api/v1/audit-log/export` (CSV/JSON)
  - Integração em todas as ações administrativas

- [ ] **Gestão de API Keys**
  - Modelo `ApiKey` para BYOK LLM e chaves de integração
  - Endpoints: criar, listar, rotar, revogar
  - Logs de uso por chave
  - Máscara de segurança (mostra apenas últimos 4 caracteres)

- [ ] **Separação Estrita de Dados**
  - Row Level Security aprimorado
  - Validação de `organization_id` em todos os endpoints
  - Testes de isolamento

- [ ] **Papéis Avançados**
  - Viewer, Editor, Reviewer, Admin com permissões granulares
  - Middleware de validação de permissões
  - Endpoints protegidos por role

#### Frontend - Pendente
- [ ] **Modal de Conflito de Edição**
  - Detecção de 409 Conflict no save
  - Exibir opções: Sobrescrever (admin), Salvar como Cópia, Mesclar/Ver Diff
  - Integração com comparador visual

- [ ] **Rota `/invite/[token]`**
  - Página de aceite de convite
  - Formulário de definição de senha
  - Validação de token
  - Informações da organização

- [ ] **Rota `/settings/audit-log`**
  - Tabela de eventos administrativos
  - Filtros (tipo, usuário, período)
  - Exportação CSV/JSON
  - Paginação

- [ ] **Rota `/settings/api-keys`**
  - Lista de chaves (mascaradas)
  - Criar nova chave
  - Rotar chave
  - Revogar chave
  - Logs de uso

- [ ] **Páginas de Erro**
  - `/403` - Acesso Negado (mensagem amigável, link para contato)
  - `/404` - Não Encontrado (sugestões de navegação)
  - `/500` - Erro do Servidor (ações de recuperação)

#### Design - Pendente
- [ ] Design das novas páginas de governança
- [ ] Modal de conflito de edição
- [ ] Páginas de erro amigáveis
- [ ] Integração com design system existente

---

### Sprint 2.6 - Design Visual & Branding ✅
**Status**: Concluído (Dezembro 2025)  
**Prioridade**: Média-Alta  
**Estimativa**: 1-2 semanas

#### Design Visual - Concluído
- ✅ **Identidade Visual**
  - Logo principal (horizontal, vertical, favicon) - SVG criados
  - Paleta de cores expandida (primary, success, warning, destructive, info)
  - Tipografia completa (Geist Sans/Mono com escala definida)
  - Guia de marca completo (`docs/design-system.md`)

- ✅ **Landing Page Completa**
  - Hero section com ilustração ProcessFlow
  - Features section com 6 cards principais
  - Casos de uso (Consulting, Internal Teams, Audit)
  - Footer completo com links e redes sociais
  - Responsividade completa (mobile/tablet/desktop)

- ✅ **Assets Visuais**
  - Ilustração ProcessFlow para seções visuais
  - EmptyStateIllustration com 4 variantes (process, document, user, chart)
  - Logo component reutilizável

- ✅ **Layouts e Componentes**
  - Design system documentado
  - Componentes atualizados com novo logo
  - Navbar, Login e Register pages atualizadas
  - Especificações técnicas no design system

---

## 📊 Progresso da Fase 2

### Por Sprint
| Sprint | Status | Progresso |
|--------|--------|-----------|
| Sprint 4 | ✅ Concluído | 100% |
| Sprint 5 | ✅ Concluído | 100% |
| Sprint 2.6 | ✅ Concluído | 100% |
| Sprint 6 | 🔮 Planejado | 0% |

### Por Área
| Área | Status | Progresso |
|------|--------|-----------|
| **Versionamento** | ✅ Completo | 100% |
| **Diff Visual** | ✅ Completo | 100% |
| **Catálogo de Processos** | ✅ Completo | 100% |
| **Conflitos de Edição** | 🔮 Planejado | 0% |
| **Sistema de Convites** | 🔮 Planejado | 0% |
| **Audit Log do Sistema** | 🔮 Planejado | 0% |
| **Gestão de API Keys** | 🔮 Planejado | 0% |
| **Páginas de Erro** | 🔮 Planejado | 0% |
| **Design Visual** | ✅ Completo | 100% |

### Progresso Geral da Fase 2
**~75% concluído** (3 de 4 sprints principais concluídos)

---

## 🔄 Pendências de Fases Anteriores

### Fase 1 - Pendências Menores
- [ ] **Auto-layout**: Refinamento final das conexões de setas (ELK.js) - 70% completo
- [ ] **Testes**: Aumentar cobertura de testes automatizados (Backend/Frontend)
- [ ] **TypeScript**: Resolver warnings restantes no BpmnEditor
- [ ] **RAG**: Melhorar qualidade dos embeddings (atualmente básico)

**Nota**: Essas pendências não bloqueiam a Fase 2, mas devem ser resolvidas quando possível.

---

## 🎯 Próximos Passos Imediatos

### Esta Semana
1. ✅ Sprint 2.6 (Design Visual) concluído
2. [ ] Planejar Sprint 6 (Governança e Segurança)
3. [ ] Priorizar funcionalidades do Sprint 6

### Próximas 2-3 Semanas
1. [ ] **Sprint 6 - Backend**: Implementar optimistic locking, sistema de convites, audit log, API keys
2. [ ] **Sprint 6 - Frontend**: Implementar páginas de governança e páginas de erro
3. [ ] **Sprint 6 - Design**: Design das novas páginas

### Próximo Mês
1. [ ] Concluir Sprint 6
2. [ ] Testes e validação
3. [ ] Preparar para Fase 3 (Colaboração)

---

## 📋 Checklist de Conclusão da Fase 2

### Funcionalidades Críticas
- [ ] Versionamento completo ✅
- [ ] Diff visual ✅
- [ ] Catálogo de processos ✅
- [ ] Conflitos de edição (optimistic locking)
- [ ] Sistema de convites
- [ ] Audit log do sistema
- [ ] Gestão de API keys
- [ ] Páginas de erro amigáveis

### Qualidade
- [ ] Testes automatizados para novas funcionalidades
- [ ] Documentação atualizada
- [ ] Design system aplicado em todas as novas páginas
- [ ] Responsividade mobile completa

### Deploy
- [ ] Ambiente de staging atualizado
- [ ] Migrações de banco testadas
- [ ] Health checks validados
- [ ] Logs estruturados funcionando

---

## 🚧 Bloqueadores e Riscos

### Bloqueadores Atuais
- Nenhum bloqueador crítico identificado

### Riscos Identificados
1. **Complexidade do Sistema de Convites**: Pode levar mais tempo que estimado
2. **Audit Log**: Pode impactar performance se não otimizado
3. **Design Visual**: Se não feito agora, pode atrasar Sprint 6

### Mitigações
- Priorizar funcionalidades críticas primeiro
- Fazer design visual em paralelo se possível
- Testar performance do audit log desde o início

---

## 📝 Notas da Fase 2

### Decisões Importantes
- **Optimistic Locking**: Escolhido em vez de locking pessimista para melhor UX
- **Sistema de Convites**: Priorizado para crescimento B2B
- **Audit Log**: Crítico para compliance e auditoria

### Lições Aprendidas
- Design system (Sprint 2.5) facilitou muito a implementação das páginas
- Diff visual foi mais complexo que esperado, mas resultado excelente
- Catálogo de processos precisa de filtros avançados desde o início

---

## 🔗 Referências

- [Roadmap Completo](roadmap.md) - Visão geral de todas as fases
- [Arquitetura de Páginas](app_pages.md) - Detalhamento das páginas
- [PRD](PRD.md) - Requisitos do produto

---

**Última atualização**: Dezembro de 2025

