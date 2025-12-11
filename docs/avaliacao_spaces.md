# Avaliação: Páginas e Lógica de Spaces

**Data**: Dezembro 2025  
**Status**: Análise do que está implementado e o que falta na lógica de spaces

---

## 📋 Visão Geral

O sistema de **Spaces** é a base de navegação do ProcessLab, permitindo organizar processos e folders em:
- **Private Space**: Espaço pessoal do usuário
- **Team Spaces**: Espaços organizacionais (baseados em Organizations)

---

## ✅ O Que Está Implementado

### 1. SpacesContext (`/contexts/SpacesContext.tsx`)

**Funcionalidades Implementadas**:
- ✅ `refreshSpaces()` - Carrega lista de spaces do usuário
- ✅ `loadTree(spaceId)` - Carrega árvore completa de um space (folders + processos)
- ✅ `selectSpace(spaceId)` - Seleciona um space ativo
- ✅ `createFolder(spaceId, payload)` - Cria folder em um space
- ✅ `createProcess(spaceId, payload)` - Cria processo em um space
- ✅ `deleteFolder(spaceId, folderId)` - Deleta folder
- ✅ `getFolder(spaceId, folderId)` - Busca folder específico na árvore carregada

**Estrutura de Dados**:
- ✅ `spaces: Space[]` - Lista de spaces disponíveis
- ✅ `trees: Record<string, SpaceTree>` - Árvores carregadas por spaceId
- ✅ `selectedSpaceId: string | null` - Space atualmente selecionado
- ✅ `loading: boolean` - Estado de carregamento

### 2. Páginas de Spaces

#### ✅ Space Page (`/spaces/[spaceId]`)
- Carrega e exibe root folders e root processes
- Integração com SpacesContext
- Empty states
- Loading states
- Navegação para folders e processos

#### ✅ Folder Page (`/spaces/[spaceId]/folders/[folderId]`)
- Carrega folder específico via `getFolder()`
- Exibe subfolders e processos dentro do folder
- Ação de deletar folder (com confirmação)
- Breadcrumbs básicos
- Empty states
- Navegação para subfolders e processos

#### ✅ Process Page (`/spaces/[spaceId]/processes/[processId]`)
- Página existe (precisa verificar implementação)

### 3. SpacesSidebar (`/components/layout/SpacesSidebar.tsx`)

**Funcionalidades**:
- ✅ Lista de spaces (private + teams)
- ✅ Árvore hierárquica de folders
- ✅ Criação de folders e processos via modal
- ✅ Navegação por spaces
- ✅ Indicador de space selecionado

### 4. Integração com Outras Páginas

#### ✅ Home Page (`/home`)
- Usa SpacesContext para carregar todos os spaces
- Exibe Private Space e Teams Spaces
- Seção "Recently Visited" integrada

#### ✅ Dashboard (`/dashboard`)
- Usa SpacesContext para Private Space
- Criação de folders funcional
- Teams Space placeholder

---

## ❌ O Que Está Faltando

### 1. SpacesContext - Funcionalidades Faltando

#### 🔴 CRÍTICO
- ❌ `updateFolder(spaceId, folderId, payload)` - **FALTANDO**: Atualizar folder (nome, descrição, cor, ícone)
- ❌ `getProcess(spaceId, processId)` - **FALTANDO**: Buscar processo específico
- ❌ `updateProcess(spaceId, processId, payload)` - **FALTANDO**: Atualizar processo
- ❌ `deleteProcess(spaceId, processId)` - **FALTANDO**: Deletar processo
- ❌ `moveFolder(spaceId, folderId, newParentId)` - **FALTANDO**: Mover folder (reorganizar hierarquia)
- ❌ `moveProcess(spaceId, processId, newFolderId)` - **FALTANDO**: Mover processo entre folders

#### 🟡 Importante
- ❌ `refreshTree(spaceId)` - **FALTANDO**: Forçar refresh da árvore (após mudanças)
- ❌ `getFolderPath(spaceId, folderId)` - **FALTANDO**: Obter caminho completo do folder (para breadcrumbs)
- ❌ `getSpaceStats(spaceId)` - **FALTANDO**: Estatísticas do space (contagem de folders, processos)
- ❌ Cache/otimização - **FALTANDO**: Evitar recarregar árvore desnecessariamente

#### 🟢 Melhorias
- ❌ Error handling mais robusto
- ❌ Retry logic para requisições falhadas
- ❌ Debounce para operações frequentes

### 2. Páginas de Spaces - Funcionalidades Faltando

#### 🔴 Space Page (`/spaces/[spaceId]`)

**Faltando**:
- ❌ **Ações rápidas**: Botões para criar folder/processo diretamente na página
- ❌ **Filtros/Busca**: Buscar folders/processos dentro do space
- ❌ **Visualizações alternativas**: Grid/List view toggle
- ❌ **Ordenação**: Por nome, data, tipo
- ❌ **Metadados do Space**: Descrição, estatísticas, membros (para team spaces)
- ❌ **Ações no Space**: Editar nome/descrição (se admin), deletar space (se owner)

#### 🔴 Folder Page (`/spaces/[spaceId]/folders/[folderId]`)

**Faltando**:
- ❌ **Editar Folder**: Modal/form para editar nome, descrição, cor, ícone
- ❌ **Criar Subfolder**: Botão para criar folder dentro deste folder
- ❌ **Criar Processo**: Botão para criar processo dentro deste folder
- ❌ **Reorganizar**: Drag & drop para reordenar folders/processos
- ❌ **Breadcrumbs Dinâmicos**: Breadcrumbs baseados na hierarquia real (navegação clicável)
- ❌ **Metadados Completos**: Data de criação/atualização, criador, contadores precisos
- ❌ **Ações em Lote**: Selecionar múltiplos itens, deletar em lote
- ❌ **Busca/Filtro**: Buscar dentro do folder
- ❌ **Visualizações**: Grid/List/Table view

#### 🟡 Process Page (`/spaces/[spaceId]/processes/[processId]`)

**Precisa Verificar**:
- ❓ Carregamento de dados do processo
- ❓ Visualização do BPMN (read-only)
- ❓ Link para abrir no editor
- ❓ Metadados do processo
- ❓ Versões do processo
- ❓ Ações (editar, deletar, duplicar)

### 3. Endpoints Backend Faltando

#### 🔴 CRÍTICO
- ❌ `GET /api/v1/spaces/{space_id}/folders/{folder_id}` - **FALTANDO**: Detalhes de um folder específico
- ❌ `PATCH /api/v1/spaces/{space_id}/folders/{folder_id}` - **FALTANDO**: Atualizar folder (nome, descrição, cor, ícone, parent)
- ❌ `GET /api/v1/spaces/{space_id}/processes/{process_id}` - **FALTANDO**: Detalhes de um processo específico
- ❌ `PATCH /api/v1/spaces/{space_id}/processes/{process_id}` - **FALTANDO**: Atualizar processo
- ❌ `DELETE /api/v1/spaces/{space_id}/processes/{process_id}` - **FALTANDO**: Deletar processo
- ❌ `PATCH /api/v1/spaces/{space_id}/folders/{folder_id}/move` - **FALTANDO**: Mover folder (mudar parent)
- ❌ `PATCH /api/v1/spaces/{space_id}/processes/{process_id}/move` - **FALTANDO**: Mover processo (mudar folder)

#### 🟡 Importante
- ❌ `GET /api/v1/spaces/{space_id}/stats` - **FALTANDO**: Estatísticas do space
- ❌ `GET /api/v1/spaces/{space_id}/folders/{folder_id}/path` - **FALTANDO**: Caminho completo do folder (para breadcrumbs)
- ❌ `PATCH /api/v1/spaces/{space_id}/folders/{folder_id}/position` - **FALTANDO**: Reordenar folders (mudar position)

#### ✅ Endpoints Existentes (Verificar se atendem completamente)
- ✅ `GET /api/v1/spaces` - Lista spaces
- ✅ `GET /api/v1/spaces/{space_id}/tree` - Árvore completa
- ✅ `POST /api/v1/spaces/{space_id}/folders` - Criar folder
- ✅ `DELETE /api/v1/spaces/{space_id}/folders/{folder_id}` - Deletar folder
- ✅ `POST /api/v1/spaces/{space_id}/processes` - Criar processo

### 4. Componentes Faltando

#### 🔴 CRÍTICO
- ❌ `FolderEditModal` - Modal para editar folder
- ❌ `ProcessEditModal` - Modal para editar processo
- ❌ `FolderActionsMenu` - Menu de ações do folder (editar, deletar, mover, etc.)
- ❌ `ProcessActionsMenu` - Menu de ações do processo
- ❌ `Breadcrumbs` - Componente de breadcrumbs dinâmicos (já existe básico, precisa melhorar)

#### 🟡 Importante
- ❌ `SpaceStats` - Cards de estatísticas do space
- ❌ `FolderGrid` / `FolderList` - Visualizações alternativas
- ❌ `DragAndDrop` - Componente para reorganizar itens
- ❌ `SearchBar` - Busca dentro de spaces/folders
- ❌ `FilterPanel` - Painel de filtros

### 5. Funcionalidades de UX Faltando

#### 🔴 CRÍTICO
- ❌ **Edição Inline**: Editar nome de folder/processo diretamente na lista
- ❌ **Confirmação de Ações Destrutivas**: Modais de confirmação para deletar
- ❌ **Feedback Visual**: Toasts para ações bem-sucedidas/erros
- ❌ **Loading States Granulares**: Loading por item durante operações

#### 🟡 Importante
- ❌ **Atalhos de Teclado**: Navegação rápida, criar item (Ctrl+N)
- ❌ **Busca Rápida**: Cmd/Ctrl+K para buscar em todos os spaces
- ❌ **Histórico de Navegação**: Voltar/avançar entre folders
- ❌ **Favoritos**: Marcar folders/processos como favoritos
- ❌ **Tags**: Sistema de tags para organizar

### 6. Integração com Outras Features

#### Faltando
- ❌ **Versionamento**: Link entre processos e versões na navegação de spaces
- ❌ **Compartilhamento**: Compartilhar folders/processos (Fase futura)
- ❌ **Permissões**: Controle de acesso granular por folder (Fase futura)
- ❌ **Auditoria**: Log de ações em folders/processos (Fase futura)

---

## 📊 Status por Área

| Área | Status | Completude | Prioridade |
|------|--------|------------|------------|
| **SpacesContext - CRUD Básico** | 🟡 Parcial | ~60% | 🔴 Alta |
| **Páginas de Spaces** | 🟡 Parcial | ~50% | 🔴 Alta |
| **Endpoints Backend** | 🟡 Parcial | ~50% | 🔴 Alta |
| **Componentes UI** | 🔴 Incompleto | ~30% | 🔴 Alta |
| **UX/Interatividade** | 🔴 Incompleto | ~20% | 🟡 Média |

---

## 🎯 Prioridades de Implementação

### Fase 1 - CRUD Completo (Esta Semana)

1. **Backend - Endpoints Faltando**
   - `GET /api/v1/spaces/{space_id}/folders/{folder_id}` - Detalhes do folder
   - `PATCH /api/v1/spaces/{space_id}/folders/{folder_id}` - Atualizar folder
   - `DELETE /api/v1/spaces/{space_id}/processes/{process_id}` - Deletar processo
   - `PATCH /api/v1/spaces/{space_id}/processes/{process_id}` - Atualizar processo

2. **SpacesContext - Métodos Faltando**
   - `updateFolder()` - Atualizar folder
   - `deleteProcess()` - Deletar processo
   - `updateProcess()` - Atualizar processo
   - `refreshTree()` - Forçar refresh

3. **Componentes UI**
   - `FolderEditModal` - Editar folder
   - `ProcessEditModal` - Editar processo
   - Melhorar breadcrumbs dinâmicos

4. **Páginas**
   - Adicionar ações de editar/deletar nas páginas
   - Adicionar botões de criar subfolder/processo

### Fase 2 - Funcionalidades Essenciais (Próximas 2 Semanas)

1. **Reorganização**
   - Endpoints de move (folder/processo)
   - Métodos no SpacesContext
   - UI de drag & drop (ou botões de mover)

2. **Breadcrumbs Dinâmicos**
   - Endpoint para obter path do folder
   - Componente de breadcrumbs navegável
   - Integração nas páginas

3. **Busca e Filtros**
   - Busca dentro de spaces/folders
   - Filtros por tipo, data, etc.

4. **Estatísticas**
   - Endpoint de stats do space
   - Componente de cards de estatísticas
   - Integração nas páginas

### Fase 3 - Polimento (Próximo Mês)

1. **Visualizações Alternativas**
   - Grid/List/Table view
   - Toggle de visualização

2. **Atalhos e UX**
   - Atalhos de teclado
   - Busca rápida (Cmd+K)
   - Feedback visual melhorado

3. **Otimizações**
   - Cache de árvores
   - Lazy loading
   - Debounce em operações

---

## 📝 Notas Técnicas

### Estrutura de Rotas Atual

```
/spaces/[spaceId]                    ✅ Implementado
/spaces/[spaceId]/folders/[folderId] ✅ Implementado
/spaces/[spaceId]/processes/[processId] ❓ Precisa verificar
```

### Estrutura de Dados

**SpaceTree** (retornado pela API):
```typescript
{
  space_type: 'private' | 'team',
  space_id: string,
  root_folders: FolderTree[],
  root_processes: SpaceProcess[]
}
```

**FolderTree** (recursivo):
```typescript
{
  id: string,
  name: string,
  description?: string,
  children: FolderTree[],
  processes: SpaceProcess[],
  process_count: number,
  child_count: number,
  // ... outros campos
}
```

### Problemas Conhecidos

1. **Folder Page**: Usa `getFolder()` que busca na árvore já carregada, mas não recarrega se a árvore não estiver carregada
2. **Breadcrumbs**: Não são dinâmicos, não refletem a hierarquia real
3. **Cache**: Não há invalidação de cache após operações (criar/editar/deletar)
4. **Error Handling**: Falta tratamento de erros mais robusto

---

**Última atualização**: Dezembro 2025

