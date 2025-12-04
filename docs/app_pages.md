# ProcessLab - Arquitetura de Páginas e Navegação

## 1. Visão Geral

Este documento detalha a arquitetura completa de páginas do ProcessLab, incluindo fluxos de navegação, interações Frontend-Backend, e como cada página se relaciona com as demais para criar uma experiência coesa e focada em conversão.

### Princípios de Design
- **Conversão**: Landing page e onboarding focados em converter visitantes em usuários
- **Clareza**: Navegação intuitiva, hierarquia visual clara
- **Produtividade**: Acesso rápido às funcionalidades principais
- **Colaboração**: Fluxos de review/approval e comentários integrados
- **Rastreabilidade**: Evidências e histórico sempre acessíveis

---

## 2. Estrutura de Rotas (Next.js App Router)

```
/                           → Landing Page (pública)
/login                      → Login (pública)
/register                   → Registro (pública)
/pricing                    → Planos e Preços (pública) [Fase 5]
/solucao                    → Página de Solução (pública) [Fase 5]
/docs                       → Documentação (pública) [Fase 5]

/dashboard                  → Dashboard Principal (protegida)
/projects                   → Catálogo de Projetos (protegida)
/projects/new               → Criar Novo Projeto (protegida)
/projects/[id]             → Detalhes do Projeto (protegida)
/projects/[id]/processes   → Processos do Projeto (protegida)

/catalog                    → Catálogo de Processos (protegida) [Fase 2]
/catalog/[processId]        → Detalhes do Processo (protegida) [Fase 2]

/studio                     → Editor BPMN (protegida)
/studio?process_id=[id]     → Editor com Processo Carregado (protegida)

/processes/[id]             → Página do Processo (protegida) [Fase 2]
/processes/[id]/versions   → Histórico de Versões (protegida) [Fase 2]
/processes/[id]/compare    → Comparar Versões (protegida) [Fase 2]
/processes/[id]/evidence   → Evidências do Processo (protegida) [Fase 4]

/reviews                    → Lista de Reviews Pendentes (protegida) [Fase 3]
/reviews/[id]               → Detalhes do Review (protegida) [Fase 3]

/reports                    → Relatórios (protegida) [Fase 4]
/reports/[type]             → Gerar Relatório (protegida) [Fase 4]

/settings                   → Configurações (protegida) [Fase 5]
/settings/profile           → Perfil do Usuário (protegida)
/settings/organization      → Configurações da Organização (protegida) [Fase 5]
/settings/integrations      → Integrações (protegida) [Fase 5]
/settings/billing           → Faturamento (protegida) [Fase 5]

/onboarding                 → Onboarding Guiado (protegida) [Sprint 2.5]
```

---

## 3. Páginas Públicas (Marketing e Conversão)

### 3.1. Landing Page (`/`)

**Objetivo**: Converter visitantes em usuários registrados, comunicar valor da plataforma.

**Conteúdo**:
- Hero section: "GitHub de Processos" - versionamento, colaboração, IA
- Problema/Solução: "Fluxogramas estáticos vs. Repositório vivo"
- Features principais:
  - Editor BPMN com IA
  - Versionamento completo (Git de processos)
  - Colaboração e aprovação
  - Rastreabilidade de evidências
- Casos de uso: Consultorias, Process Owners, Auditores
- CTA principal: "Começar Grátis" → `/register`
- CTA secundário: "Ver Demo" → modal/vídeo
- Depoimentos/testemunhos (Fase 5)
- Footer: links, docs, contato

**Interações Frontend-Backend**:
- `GET /api/v1/public/stats` (opcional): estatísticas públicas (processos criados, usuários)
- Analytics: tracking de cliques em CTAs, scroll depth

**Navegação**:
- Header: Logo, "Solução", "Pricing", "Docs", "Login", "Começar Grátis"
- Footer: Links legais, redes sociais, contato

**Fase**: Sprint 2.5 (Design System)

---

### 3.2. Login (`/login`)

**Objetivo**: Autenticar usuários existentes.

**Conteúdo**:
- Formulário: email, senha
- "Esqueci minha senha" → `/forgot-password` (Fase 5)
- "Não tem conta? Registre-se" → `/register`
- SSO buttons (SAML/OIDC) → Fase 5
- Validação em tempo real

**Interações Frontend-Backend**:
- `POST /api/v1/auth/login`
  - Request: `{ email, password }`
  - Response: `{ access_token, user: { id, email, name, organization_id } }`
- Armazena token no `AuthContext`
- Redireciona para `/dashboard` ou URL de retorno

**Navegação**:
- Sucesso → `/dashboard` (ou URL de retorno)
- Erro → exibe mensagem, mantém na página
- Link para registro → `/register`

**Fase**: Fase 1 (✅ Implementado)

---

### 3.3. Register (`/register`)

**Objetivo**: Criar nova conta e organização.

**Conteúdo**:
- Formulário: nome, email, senha, confirmação de senha
- Checkbox: "Aceito termos e política de privacidade"
- Validação: email válido, senha forte, confirmação match
- Feedback visual em tempo real

**Interações Frontend-Backend**:
- `POST /api/v1/auth/register`
  - Request: `{ name, email, password }`
  - Response: `{ access_token, user: { id, email, name, organization_id }, organization: { id, name } }`
- Cria automaticamente:
  - `User` com role `admin`
  - `Organization` com nome baseado no email
- Armazena token no `AuthContext`
- Redireciona para `/onboarding` (primeira vez) ou `/dashboard`

**Navegação**:
- Sucesso → `/onboarding` (primeira vez) ou `/dashboard`
- Erro → exibe mensagem, mantém na página
- Link para login → `/login`

**Fase**: Fase 1 (✅ Implementado)

---

### 3.4. Pricing (`/pricing`) [Fase 5]

**Objetivo**: Apresentar planos e preços, converter em assinaturas.

**Conteúdo**:
- Tabela de planos: Starter, Professional, Enterprise
- Features por plano
- CTA: "Começar com [Plano]"
- FAQ sobre preços
- Comparação de planos

**Interações Frontend-Backend**:
- `GET /api/v1/public/pricing`: informações de planos (cache)
- `POST /api/v1/billing/subscribe`: criar assinatura (Fase 5)

**Navegação**:
- CTA → `/register?plan=[plan_id]`
- Link para contato enterprise

**Fase**: Fase 5

---

### 3.5. Solução (`/solucao`) [Fase 5]

**Objetivo**: Detalhar funcionalidades e casos de uso.

**Conteúdo**:
- Seções: Editor BPMN, IA/Copilot, Versionamento, Colaboração, Rastreabilidade
- Casos de uso por persona: Consultor, Process Owner, Auditor
- Screenshots/demos
- Comparação com alternativas

**Interações Frontend-Backend**:
- Apenas conteúdo estático (ou CMS)

**Navegação**:
- CTAs → `/register` ou `/login`
- Links internos para seções

**Fase**: Fase 5

---

## 4. Páginas Autenticadas (Aplicação Principal)

### 4.1. Dashboard (`/dashboard`)

**Objetivo**: Visão geral do usuário, acesso rápido a projetos e processos.

**Conteúdo**:
- Cards de resumo:
  - Projetos ativos
  - Processos totais
  - Reviews pendentes (Fase 3)
  - Processos recentes
- Lista de projetos recentes (últimos 5)
- Lista de processos recentes (últimos 5)
- Ações rápidas:
  - "Criar Novo Projeto"
  - "Criar Novo Processo" (se projeto selecionado)
- Notificações (Fase 3): comentários, approvals pendentes

**Interações Frontend-Backend**:
- `GET /api/v1/projects?limit=5&order_by=updated_at`
- `GET /api/v1/processes?limit=5&order_by=updated_at`
- `GET /api/v1/reviews/pending` (Fase 3)
- `GET /api/v1/notifications` (Fase 3)

**Navegação**:
- Projeto → `/projects/[id]`
- Processo → `/processes/[id]`
- Review → `/reviews/[id]`
- "Ver Todos" → `/projects` ou `/catalog`

**Fase**: Fase 1 (✅ Implementado)

---

### 4.2. Catálogo de Projetos (`/projects`)

**Objetivo**: Listar e gerenciar projetos da organização.

**Conteúdo**:
- Filtros: nome, data de criação, status
- Grid/Lista de projetos:
  - Nome, descrição, número de processos
  - Data de criação/atualização
  - Ações: ver, editar, deletar
- Botão "Criar Novo Projeto"
- Busca por nome
- Paginação

**Interações Frontend-Backend**:
- `GET /api/v1/projects?organization_id=[id]&search=[term]&page=[n]`
- `DELETE /api/v1/projects/[id]` (admin apenas)

**Navegação**:
- Projeto → `/projects/[id]`
- Criar → `/projects/new`
- Dashboard → `/dashboard`

**Fase**: Fase 1 (✅ Implementado)

---

### 4.3. Detalhes do Projeto (`/projects/[id]`)

**Objetivo**: Visualizar detalhes e processos de um projeto.

**Conteúdo**:
- Header: nome, descrição, ações (editar, deletar)
- Tabs:
  - "Processos": lista de processos do projeto
  - "Configurações" (admin): editar projeto
  - "Membros" (Fase 5): gerenciar acesso
- Estatísticas: número de processos, versões ativas

**Interações Frontend-Backend**:
- `GET /api/v1/projects/[id]`
- `GET /api/v1/projects/[id]/processes`
- `PUT /api/v1/projects/[id]` (admin)
- `DELETE /api/v1/projects/[id]` (admin)

**Navegação**:
- Processo → `/processes/[id]`
- "Criar Processo" → `/studio?project_id=[id]`
- Voltar → `/projects`

**Fase**: Fase 1 (✅ Implementado)

---

### 4.4. Catálogo de Processos (`/catalog`) [Fase 2]

**Objetivo**: Buscar e filtrar processos da organização.

**Conteúdo**:
- Filtros avançados:
  - Status: rascunho, em revisão, ativo, obsoleto
  - Área/departamento
  - Dono/responsável
  - Projeto
  - Risco/criticidade (Fase 4)
- Busca semântica (RAG) [Fase 4]
- Grid/Lista de processos:
  - Nome, status, dono, projeto
  - Última atualização
  - Versão ativa
- Ações: ver, editar, comparar versões

**Interações Frontend-Backend**:
- `GET /api/v1/processes?organization_id=[id]&status=[status]&owner=[id]&project=[id]&search=[term]`
- `GET /api/v1/search/processes?query=[term]` (busca semântica, Fase 4)

**Navegação**:
- Processo → `/processes/[id]`
- Comparar → `/processes/[id]/compare`

**Fase**: Fase 2

---

### 4.5. Página do Processo (`/processes/[id]`)

**Objetivo**: Visualizar detalhes, versões, evidências e colaboração de um processo.

**Conteúdo**:
- Header: nome, status, dono, projeto
- Tabs:
  - **"Diagrama"**: preview do BPMN (read-only), botão "Abrir no Editor"
  - **"Versões"**: timeline de versões, diff visual
  - **"Evidências"** (Fase 4): documentos/trechos vinculados
  - **"Comentários"** (Fase 3): threads de comentários
  - **"Reviews"** (Fase 3): propostas de mudança pendentes
  - **"Configurações"** (admin): editar processo
- Sidebar: metadados, estatísticas, ações rápidas

**Interações Frontend-Backend**:
- `GET /api/v1/processes/[id]`
- `GET /api/v1/processes/[id]/versions`
- `GET /api/v1/processes/[id]/versions/active` (BPMN_JSON)
- `GET /api/v1/processes/[id]/evidence` (Fase 4)
- `GET /api/v1/processes/[id]/comments` (Fase 3)
- `GET /api/v1/processes/[id]/reviews` (Fase 3)

**Navegação**:
- "Abrir no Editor" → `/studio?process_id=[id]`
- Versão → `/processes/[id]/versions/[version_id]`
- Comparar → `/processes/[id]/compare?v1=[id]&v2=[id]`

**Fase**: Fase 2 (base), Fase 3 (colaboração), Fase 4 (evidências)

---

### 4.6. Editor BPMN (`/studio`)

**Objetivo**: Editar processos BPMN com IA/Copilot integrado.

**Conteúdo**:
- Layout split:
  - **Esquerda**: Editor bpmn-js (canvas)
  - **Direita**: Copilot (chat de IA)
- Toolbar:
  - Salvar versão
  - Exportar (XML, PNG, PDF)
  - Histórico de versões
  - Comentários (Fase 3)
- Breadcrumbs: Projeto → Processo
- Seletor de versão (carregar versão específica)

**Interações Frontend-Backend**:
- `GET /api/v1/processes/[id]/versions/active` (carregar processo)
- `POST /api/v1/versions` (salvar nova versão)
- `POST /api/v1/edit` (comando do Copilot)
- `POST /api/v1/generate` (gerar processo a partir de artefatos)
- `POST /api/v1/export` (exportar XML/PNG/PDF)
- `GET /api/v1/processes/[id]/versions` (histórico)

**Navegação**:
- Salvar → permanece na página, mostra toast
- "Ver Processo" → `/processes/[id]`
- Voltar → `/projects/[id]` ou `/dashboard`

**Fase**: Fase 1 (✅ Implementado), Fase 3 (comentários)

---

### 4.7. Comparar Versões (`/processes/[id]/compare`)

**Objetivo**: Visualizar diferenças entre duas versões de um processo.

**Conteúdo**:
- Seletor de versões: escolher v1 e v2
- Visualização lado a lado:
  - Esquerda: versão antiga
  - Direita: versão nova
  - Highlights: verde (adicionado), vermelho (removido), amarelo (modificado)
- Legenda de cores
- Lista de mudanças: elementos/fluxos alterados
- Botão "Reverter para v1" (admin)

**Interações Frontend-Backend**:
- `GET /api/v1/versions/[id1]/diff/[id2]` (diff textual)
- `GET /api/v1/versions/[id1]` (BPMN_JSON v1)
- `GET /api/v1/versions/[id2]` (BPMN_JSON v2)
- Frontend calcula diff visual usando `bpmn-js-differ`

**Navegação**:
- Selecionar versões → atualiza comparação
- "Reverter" → confirmação → `/processes/[id]`
- Voltar → `/processes/[id]`

**Fase**: Fase 2 (✅ Diff visual implementado)

---

### 4.8. Histórico de Versões (`/processes/[id]/versions`)

**Objetivo**: Timeline completa de versões de um processo.

**Conteúdo**:
- Timeline vertical:
  - Cada versão: número, mensagem de commit, autor, data
  - Status: ativa, rascunho, obsoleta
  - Ações: ver, comparar, ativar, reverter
- Filtros: data, autor, status
- Busca por mensagem de commit

**Interações Frontend-Backend**:
- `GET /api/v1/processes/[id]/versions?order_by=created_at&desc=true`
- `PUT /api/v1/versions/[id]/activate`
- `GET /api/v1/versions/[id]` (detalhes)

**Navegação**:
- Versão → `/processes/[id]/versions/[version_id]`
- Comparar → `/processes/[id]/compare?v1=[id]&v2=[id]`
- Voltar → `/processes/[id]`

**Fase**: Fase 2 (✅ Implementado)

---

### 4.9. Reviews Pendentes (`/reviews`) [Fase 3]

**Objetivo**: Listar e gerenciar propostas de mudança pendentes.

**Conteúdo**:
- Lista de reviews:
  - Processo, versão proposta, autor
  - Status: pendente, em revisão, aprovado, rejeitado
  - Data de criação
  - Número de comentários
- Filtros: status, processo, autor
- Ações: revisar, aprovar, rejeitar

**Interações Frontend-Backend**:
- `GET /api/v1/reviews?organization_id=[id]&status=[status]`
- `GET /api/v1/reviews/[id]`
- `PUT /api/v1/reviews/[id]/approve`
- `PUT /api/v1/reviews/[id]/reject`
- `PUT /api/v1/reviews/[id]/promote` (promover para ativa)

**Navegação**:
- Review → `/reviews/[id]`
- Processo → `/processes/[id]`

**Fase**: Fase 3

---

### 4.10. Detalhes do Review (`/reviews/[id]`) [Fase 3]

**Objetivo**: Revisar proposta de mudança, comentar, aprovar/rejeitar.

**Conteúdo**:
- Header: processo, versão atual vs. proposta
- Diff visual: comparação lado a lado
- Comentários: threads de discussão
- Ações (reviewer/aprovador):
  - "Aprovar" → promove versão para ativa
  - "Rejeitar" → fecha review
  - "Solicitar Mudanças" → adiciona comentário

**Interações Frontend-Backend**:
- `GET /api/v1/reviews/[id]`
- `POST /api/v1/reviews/[id]/comments`
- `PUT /api/v1/reviews/[id]/approve`
- `PUT /api/v1/reviews/[id]/reject`
- `PUT /api/v1/reviews/[id]/promote`

**Navegação**:
- Processo → `/processes/[id]`
- Voltar → `/reviews`

**Fase**: Fase 3

---

### 4.11. Evidências do Processo (`/processes/[id]/evidence`) [Fase 4]

**Objetivo**: Visualizar documentos e trechos que embasaram o processo.

**Conteúdo**:
- Lista de evidências por versão:
  - Documento: nome, tipo, data de upload
  - Trechos usados: página/timestamp, preview
  - Elementos vinculados: links para elementos do BPMN
- Filtros: versão, tipo de documento, elemento
- Visualização: preview de documentos, highlights de trechos

**Interações Frontend-Backend**:
- `GET /api/v1/processes/[id]/evidence?version_id=[id]`
- `GET /api/v1/processes/[id]/evidence/elements/[element_id]`
- `GET /api/v1/artifacts/[id]/preview` (preview de documento)

**Navegação**:
- Documento → download ou preview
- Elemento → `/processes/[id]` (scroll para elemento)
- Versão → `/processes/[id]/versions/[version_id]`

**Fase**: Fase 4

---

### 4.12. Relatórios (`/reports`) [Fase 4]

**Objetivo**: Gerar e visualizar relatórios automáticos.

**Conteúdo**:
- Tipos de relatório:
  - POP (Procedimento Operacional Padrão)
  - Resumo Executivo
  - Relatório de Conformidade
  - Relatório de Rastreabilidade
- Formulário: selecionar processo, versão, opções
- Preview e download (PDF/DOCX)

**Interações Frontend-Backend**:
- `GET /api/v1/reports/types`
- `POST /api/v1/reports/pop` → gera POP
- `POST /api/v1/reports/summary` → gera resumo
- `POST /api/v1/reports/compliance` → gera conformidade
- Response: URL de download ou stream de arquivo

**Navegação**:
- Processo → `/processes/[id]`
- Download → arquivo PDF/DOCX

**Fase**: Fase 4

---

### 4.13. Onboarding (`/onboarding`) [Sprint 2.5]

**Objetivo**: Guiar novos usuários na primeira utilização.

**Conteúdo**:
- Tour interativo:
  1. Criar primeiro projeto
  2. Fazer upload de documento
  3. Gerar processo com IA
  4. Editar no editor
  5. Salvar versão
- Progresso: indicador de etapas completadas
- Pular tour (opcional)

**Interações Frontend-Backend**:
- `GET /api/v1/users/me/onboarding_status`
- `PUT /api/v1/users/me/onboarding_complete`

**Navegação**:
- Próxima etapa → próxima página do tour
- Concluir → `/dashboard`
- Pular → `/dashboard`

**Fase**: Sprint 2.5 (Fase 1)

---

### 4.14. Configurações (`/settings`)

**Objetivo**: Gerenciar perfil, organização e integrações.

**Conteúdo**:
- Tabs:
  - **"Perfil"**: nome, email, senha, avatar
  - **"Organização"** (admin): nome, domínio, membros
  - **"Integrações"** (Fase 5): SSO, Slack, Teams, Jira
  - **"Faturamento"** (Fase 5): plano, pagamento, uso
  - **"API Keys"**: chaves BYOK para LLM (Fase 1)

**Interações Frontend-Backend**:
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `GET /api/v1/organizations/[id]` (admin)
- `PUT /api/v1/organizations/[id]` (admin)
- `GET /api/v1/integrations` (Fase 5)
- `POST /api/v1/integrations/[type]` (Fase 5)

**Navegação**:
- Salvar → permanece na página, toast de sucesso
- Voltar → `/dashboard`

**Fase**: Fase 1 (perfil), Fase 5 (organização, integrações)

---

## 5. Fluxos de Navegação Principais

### 5.1. Fluxo de Primeiro Acesso (Novo Usuário)

```
Landing (/) 
  → Register (/register)
    → Onboarding (/onboarding)
      → Dashboard (/dashboard)
        → Criar Projeto (/projects/new)
          → Projeto (/projects/[id])
            → Criar Processo (/studio?project_id=[id])
              → Editor (/studio)
                → Salvar Versão
                  → Processo (/processes/[id])
```

### 5.2. Fluxo de Edição de Processo

```
Dashboard (/dashboard)
  → Processo (/processes/[id])
    → "Abrir no Editor" (/studio?process_id=[id])
      → Editor (/studio)
        → Copilot (editar via IA)
        → Salvar Nova Versão
          → Processo (/processes/[id])
            → Versões (/processes/[id]/versions)
```

### 5.3. Fluxo de Review/Aprovação [Fase 3]

```
Editor (/studio)
  → Salvar como "Proposta" (cria ReviewRequest)
    → Reviews (/reviews)
      → Detalhes do Review (/reviews/[id])
        → Comentar/Aprovar
          → Promover para Ativa
            → Processo (/processes/[id]) [versão atualizada]
```

### 5.4. Fluxo de Comparação de Versões

```
Processo (/processes/[id])
  → Versões (/processes/[id]/versions)
    → Selecionar duas versões
      → Comparar (/processes/[id]/compare?v1=[id]&v2=[id])
        → Visualizar diff
          → Reverter (opcional)
```

---

## 6. Interações Frontend-Backend por Funcionalidade

### 6.1. Autenticação

**Endpoints**:
- `POST /api/v1/auth/login` → `{ access_token, user }`
- `POST /api/v1/auth/register` → `{ access_token, user, organization }`
- `GET /api/v1/auth/me` → `{ user }` (validar token)
- `POST /api/v1/auth/logout` → (invalidar token, Fase 5)

**Frontend**:
- `AuthContext` gerencia token e estado de autenticação
- `ProtectedRoute` valida token antes de renderizar
- Token armazenado em `localStorage` ou cookie httpOnly (Fase 5)

---

### 6.2. Projetos

**Endpoints**:
- `GET /api/v1/projects?organization_id=[id]` → lista
- `GET /api/v1/projects/[id]` → detalhes
- `POST /api/v1/projects` → criar
- `PUT /api/v1/projects/[id]` → atualizar (admin)
- `DELETE /api/v1/projects/[id]` → deletar (admin)

**Frontend**:
- Lista com paginação e busca
- Formulário de criação/edição
- Validação em tempo real

---

### 6.3. Processos

**Endpoints**:
- `GET /api/v1/processes?organization_id=[id]&filters` → lista com filtros
- `GET /api/v1/processes/[id]` → detalhes
- `GET /api/v1/processes/[id]/versions` → histórico
- `GET /api/v1/processes/[id]/versions/active` → versão ativa (BPMN_JSON)
- `POST /api/v1/processes` → criar (via generate ou manual)

**Frontend**:
- Catálogo com filtros avançados
- Preview do diagrama (read-only)
- Timeline de versões

---

### 6.4. Versionamento

**Endpoints**:
- `POST /api/v1/versions` → criar nova versão
  - Request: `{ process_id, bpmn_json, commit_message, change_type }`
  - Response: `{ version_id, process_id, created_at }`
- `GET /api/v1/versions?process_id=[id]` → histórico
- `GET /api/v1/versions/[id]` → detalhes
- `GET /api/v1/versions/[id1]/diff/[id2]` → diff textual
- `PUT /api/v1/versions/[id]/activate` → ativar versão

**Frontend**:
- Modal "Salvar Nova Versão" no editor
- Timeline de versões
- Diff visual usando `bpmn-js-differ`

---

### 6.5. Editor e Copilot

**Endpoints**:
- `POST /api/v1/generate` → gerar processo a partir de artefatos
- `POST /api/v1/edit` → editar processo via comando NL
- `POST /api/v1/export` → exportar (XML, PNG, PDF)

**Frontend**:
- `BpmnEditor`: carrega bpmn-js, gerencia estado do diagrama
- `Copilot`: chat interface, envia comandos para `/edit`
- Sincronização: salvar versão após edições

---

### 6.6. Colaboração [Fase 3]

**Endpoints**:
- `POST /api/v1/comments` → criar comentário
- `GET /api/v1/comments?process_id=[id]` → listar comentários
- `PUT /api/v1/comments/[id]/resolve` → marcar como resolvido
- `POST /api/v1/reviews/request` → criar proposta
- `GET /api/v1/reviews?organization_id=[id]` → listar reviews
- `PUT /api/v1/reviews/[id]/approve` → aprovar
- `PUT /api/v1/reviews/[id]/promote` → promover para ativa

**Frontend**:
- Comentários inline no diagrama
- Threads de discussão
- Fluxo de aprovação visual

---

### 6.7. Rastreabilidade [Fase 4]

**Endpoints**:
- `GET /api/v1/processes/[id]/evidence` → evidências por versão
- `GET /api/v1/processes/[id]/evidence/elements/[element_id]` → evidências por elemento
- `GET /api/v1/artifacts/[id]` → detalhes do artefato
- `GET /api/v1/artifacts/[id]/preview` → preview do documento

**Frontend**:
- Lista de evidências com preview
- Links para elementos do BPMN
- Visualização de trechos destacados

---

### 6.8. Relatórios [Fase 4]

**Endpoints**:
- `POST /api/v1/reports/pop` → gerar POP
- `POST /api/v1/reports/summary` → gerar resumo
- `POST /api/v1/reports/compliance` → gerar conformidade
- Response: URL de download ou stream

**Frontend**:
- Formulário de geração
- Preview (opcional)
- Download de arquivo

---

## 7. Componentes Reutilizáveis (Design System)

### 7.1. Componentes de Navegação

- **Header**: logo, menu, perfil, notificações
- **Breadcrumbs**: hierarquia de navegação
- **Sidebar**: menu lateral (opcional, Fase 5)
- **Footer**: links, copyright

### 7.2. Componentes de Formulário

- **Input**: texto, email, senha, textarea
- **Select**: dropdown, multi-select
- **Checkbox/Radio**: seleção
- **Button**: primário, secundário, outline, danger
- **Modal**: diálogos, confirmações

### 7.3. Componentes de Dados

- **Table**: listagens com paginação
- **Card**: exibição de projetos/processos
- **Timeline**: histórico de versões
- **DiffViewer**: comparação visual
- **Chart**: gráficos (Fase 5)

### 7.4. Componentes de Feedback

- **Toast**: notificações temporárias
- **Loading**: spinners, skeletons
- **Empty State**: estados vazios
- **Error**: mensagens de erro

### 7.5. Componentes Específicos

- **BpmnEditor**: editor BPMN integrado
- **Copilot**: chat de IA
- **VersionTimeline**: timeline de versões
- **CommentThread**: threads de comentários
- **ReviewCard**: card de review

---

## 8. Estados e Gerenciamento de Dados

### 8.1. Context API (React)

- **AuthContext**: autenticação, usuário, token
- **ThemeContext**: tema claro/escuro (Fase 5)
- **NotificationContext**: notificações em tempo real (Fase 3)

### 8.2. Estado Local (useState)

- Formulários
- Modais
- Filtros e busca
- UI state (tabs, accordions)

### 8.3. Cache e Otimização

- **SWR ou React Query**: cache de requisições
- **localStorage**: preferências do usuário
- **Service Workers**: cache offline (Fase 5)

---

## 9. Segurança e Permissões

### 9.1. Proteção de Rotas

- `ProtectedRoute`: valida autenticação
- `RoleBasedRoute`: valida papel (viewer, editor, admin)
- Redirecionamento automático para `/login` se não autenticado

### 9.2. Permissões por Página

- **Dashboard**: todos autenticados
- **Editor**: editor, admin
- **Configurações**: admin apenas
- **Reviews**: reviewer, aprovador, admin

### 9.3. Validação Backend

- Todos os endpoints validam `organization_id`
- Row Level Security (Fase 2)
- RBAC avançado (Fase 5)

---

## 10. Responsividade e Acessibilidade

### 10.1. Breakpoints (Mobile-First)

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### 10.2. Acessibilidade

- WCAG AA: contraste, navegação por teclado
- ARIA labels: elementos interativos
- Screen readers: textos alternativos
- Foco visível: indicadores de foco

---

## 11. Performance e Otimização

### 11.1. Lazy Loading

- Editor BPMN: carregar apenas quando necessário
- Imagens: lazy loading
- Rotas: code splitting automático (Next.js)

### 11.2. Cache

- API responses: SWR/React Query
- Assets: CDN (Fase 5)
- Service Workers: cache offline (Fase 5)

---

## 12. Evolução por Fase

### Fase 1 (MVP) ✅
- Landing, Login, Register
- Dashboard, Projetos, Editor
- Autenticação básica

### Fase 2 (Versionamento)
- Catálogo de Processos
- Histórico de Versões
- Comparação Visual

### Fase 3 (Colaboração)
- Comentários Ancorados
- Reviews e Aprovação
- Notificações

### Fase 4 (Rastreabilidade)
- Evidências
- Relatórios Automáticos
- Busca Semântica

### Fase 5 (Enterprise)
- Pricing, Solução
- SSO, Integrações
- Configurações Avançadas
- Dashboards Executivos

---

## 13. Notas de Implementação

### 13.1. Design System (Sprint 2.5)

- Criar `src/design-system/` com tokens e componentes
- Aplicar em todas as novas páginas
- Documentar uso de componentes

### 13.2. Onboarding

- Primeira visita: redirecionar para `/onboarding`
- Marcar como completo no backend
- Pular tour opcional

### 13.3. Empty States

- Mensagens acolhedoras
- CTAs claros
- Ilustrações (opcional)

### 13.4. Error Handling

- Páginas de erro: 404, 500
- Mensagens amigáveis
- Ações de recuperação

---

## 14. Métricas e Analytics

### 14.1. Conversão

- Taxa de registro (Landing → Register)
- Taxa de ativação (Register → Primeiro Processo)
- Tempo até primeira ação

### 14.2. Engajamento

- Páginas mais visitadas
- Tempo médio por página
- Taxa de retorno

### 14.3. Performance

- Tempo de carregamento
- Taxa de erro
- Core Web Vitals

---

Este documento serve como guia completo para a implementação das páginas do ProcessLab, garantindo consistência, usabilidade e foco em conversão em todas as fases do produto.

