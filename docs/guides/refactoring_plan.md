# Plano de Refatoração Crítica - apps/api/app

## 📋 Análise Crítica da Estrutura Atual

### 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

#### 1. **DUPLICAÇÃO DE SCHEMAS** (CRÍTICO)
**Problema**: Schemas duplicados em múltiplos locais causando inconsistências

- `app/api/__init__.py` define `GenerateRequest`, `GenerateResponse`, `EditRequest`, `EditResponse`, `ExportRequest`, `ExportResponse`
- `app/api/v1/endpoints/generate.py` define NOVAMENTE `GenerateRequest` e `GenerateResponse` com campos DIFERENTES
- `app/api/v1/endpoints/edit.py` importa de `app.api` mas os schemas são diferentes
- `app/api/v1/endpoints/export.py` importa `ExportRequest` e `ExportResponse` de `app.api` mas pode ter divergências

**Impacto**: 
- Inconsistência entre documentação OpenAPI e implementação real
- Manutenção duplicada
- Bugs difíceis de rastrear
- Confusão sobre qual schema usar

#### 2. **ESTRUTURA DE PASTAS CONFUSA** (CRÍTICO)
**Problema**: Organização não segue padrão claro

```
app/
├── api/                    # ❌ Mistura schemas E endpoints
│   ├── __init__.py         # Schemas (EditRequest, GenerateRequest, etc)
│   ├── processes.py        # Schemas (ProcessResponse)
│   ├── spaces.py           # Schemas (SpaceTreeResponse)
│   ├── hierarchy.py        # Schemas (FolderTree)
│   ├── governance.py       # Schemas (ConflictError)
│   ├── versioning.py       # Schemas (ModelVersionResponse)
│   └── v1/
│       └── endpoints/      # Endpoints reais
├── api_schemas/            # ❌ PASTA VAZIA (apenas __pycache__)
└── ...
```

**Problemas**:
- `api/` contém tanto schemas quanto estrutura de versão
- `api_schemas/` existe mas está vazia (deveria ter sido removida ou usada)
- Schemas espalhados em múltiplos arquivos sem organização clara
- Difícil encontrar onde cada schema está definido

#### 3. **INCONSISTÊNCIA DE NOMENCLATURA** (ALTO)
**Problema**: Padrões de nomenclatura inconsistentes

- `app/api/__init__.py`: `IngestRequest` (não existe), `IngestResponse` (camelCase)
- `app/api/v1/endpoints/generate.py`: `GenerateRequest` (diferente do `__init__.py`)
- `app/api/processes.py`: `ProcessResponse` (snake_case)
- `app/api/spaces.py`: `SpaceTreeResponse` (PascalCase)
- `app/api/hierarchy.py`: `FolderTree`, `FolderCreate` (PascalCase)

**Impacto**: Confusão sobre qual padrão seguir

#### 4. **DEPENDÊNCIAS CIRCULARES E PROBLEMAS DE INJEÇÃO** (CRÍTICO)
**Problema**: Sistema de dependências mal estruturado

- `app/core/dependencies.py` tem funções helper internas (`_get_version_repository_internal`) que não fazem sentido
- Algumas dependências usam `Depends(get_db)` diretamente, outras não
- Inconsistência entre endpoints sobre como receber `db`
- Alguns endpoints recebem `db` explicitamente, outros via `Depends()`

**Exemplo problemático**:
```python
# dependencies.py
def get_version_repository(db: Session = Depends(get_db)) -> VersionRepository:
    return _get_version_repository_internal(db)

# Mas alguns endpoints fazem:
def endpoint(db: Session = Depends(get_db)):
    version_repo = get_version_repository(db)  # Passa db manualmente
```

#### 5. **ARQUIVO __init__.py VAZIO SEM PROPÓSITO** (MÉDIO)
**Problema**: `app/api/v1/__init__.py` está praticamente vazio

- Apenas comentário explicando que imports são feitos em `router.py`
- Não exporta nada útil
- Deveria exportar tipos comuns ou ser removido

#### 6. **PASTA api_schemas VAZIA** (BAIXO)
**Problema**: Pasta existe mas não contém arquivos (apenas `__pycache__`)

- Deveria ser removida ou ter propósito claro
- Indica refatoração incompleta

#### 7. **IMPORTAÇÕES CIRCULARES POTENCIAIS** (ALTO)
**Problema**: Estrutura atual facilita importações circulares

- `app/api/__init__.py` importa de `packages/shared-schemas` com lógica complexa
- `app/api/v1/router.py` importa de `app.api.v1.endpoints`
- `app/api/v1/endpoints/*` importam de `app.api.*` (schemas)
- Se algum endpoint tentar importar algo de `app.api.v1`, cria ciclo

#### 8. **FALTA DE SEPARAÇÃO CLARA DE RESPONSABILIDADES** (ALTO)
**Problema**: Camadas não estão claramente separadas

- Endpoints fazem conversão de entidades para responses (`_entity_to_response`)
- Schemas misturados com lógica de API
- Difícil testar isoladamente

#### 9. **SCHEMAS DEFINIDOS NO LUGAR ERRADO** (CRÍTICO)
**Problema**: Schemas de domínio misturados com schemas de API

- `app/api/processes.py`, `app/api/spaces.py`, etc. são schemas de domínio/resposta
- Mas estão na pasta `api/` que deveria ser apenas estrutura HTTP
- Deveriam estar em `app/api/schemas/` ou similar

#### 10. **FALTA DE VALIDAÇÃO CONSISTENTE** (MÉDIO)
**Problema**: Alguns schemas têm validação, outros não

- `FolderBase` tem `min_length=1, max_length=255`
- `GenerateRequest` em `endpoints/generate.py` não tem validação
- `ProcessResponse` não valida tipos

---

## ✅ PLANO DE REFATORAÇÃO PERFEITO

### FASE 1: Reorganização de Estrutura de Pastas

#### 1.1 Criar estrutura clara de schemas

```
app/
├── api/
│   ├── __init__.py              # Apenas exports principais
│   ├── schemas/                 # ✨ NOVO: Todos os schemas organizados
│   │   ├── __init__.py          # Re-exports
│   │   ├── common.py            # Schemas compartilhados (BPMNJSON, etc)
│   │   ├── processes.py        # ProcessRequest, ProcessResponse
│   │   ├── folders.py          # FolderRequest, FolderResponse, FolderTree
│   │   ├── spaces.py           # SpaceTreeResponse, SpaceSummary
│   │   ├── versions.py         # ModelVersionCreate, ModelVersionResponse
│   │   ├── bpmn_operations.py  # GenerateRequest/Response, EditRequest/Response, ExportRequest/Response
│   │   └── governance.py      # ConflictError, etc
│   └── v1/
│       ├── __init__.py         # Export router e tipos principais
│       ├── router.py           # Router principal
│       └── endpoints/          # Apenas endpoints HTTP (sem schemas)
│           ├── __init__.py
│           ├── processes.py
│           ├── folders.py
│           ├── spaces.py
│           ├── generate.py
│           ├── edit.py
│           ├── export.py
│           ├── ingestion.py
│           └── search.py
```

#### 1.2 Remover pasta vazia
- Deletar `app/api_schemas/` completamente

### FASE 2: Consolidação de Schemas

#### 2.1 Unificar schemas duplicados

**Ação**: Consolidar `GenerateRequest` e `GenerateResponse`

- Remover de `app/api/__init__.py`
- Manter apenas em `app/api/schemas/bpmn_operations.py`
- Atualizar todos os imports

**Ação**: Consolidar `EditRequest` e `EditResponse`

- Remover de `app/api/__init__.py`
- Manter apenas em `app/api/schemas/bpmn_operations.py`
- Atualizar imports em `endpoints/edit.py`

**Ação**: Consolidar `ExportRequest` e `ExportResponse`

- Remover de `app/api/__init__.py`
- Manter apenas em `app/api/schemas/bpmn_operations.py`

#### 2.2 Mover schemas de domínio para local correto

**Ação**: Mover schemas de resposta para `app/api/schemas/`

- `app/api/processes.py` → `app/api/schemas/processes.py`
- `app/api/spaces.py` → `app/api/schemas/spaces.py`
- `app/api/hierarchy.py` → `app/api/schemas/folders.py` (merge com folders)
- `app/api/versioning.py` → `app/api/schemas/versions.py`
- `app/api/governance.py` → `app/api/schemas/governance.py`

#### 2.3 Criar schema comum para BPMN

**Ação**: Criar `app/api/schemas/common.py`

- Centralizar importação de `BPMNJSON`, `BPMNElement`, etc.
- Lógica de fallback para stubs
- Re-exportar para uso em outros schemas

### FASE 3: Padronização de Nomenclatura

#### 3.1 Padrão de nomenclatura unificado

**Regra**: Todos os schemas seguem padrão PascalCase

- Request schemas: `{Resource}{Action}Request` (ex: `ProcessCreateRequest`, `ProcessUpdateRequest`)
- Response schemas: `{Resource}Response` (ex: `ProcessResponse`, `FolderResponse`)
- DTOs internos: `{Resource}{Purpose}` (ex: `ProcessSummary`, `FolderTree`)

**Ação**: Renomear schemas inconsistentes

- `FolderCreate` → `FolderCreateRequest` (já está correto, mas padronizar)
- `FolderUpdate` → `FolderUpdateRequest`
- `ModelVersionCreate` → `VersionCreateRequest`
- `ModelVersionResponse` → `VersionResponse`

#### 3.2 Padronizar campos

**Regra**: Todos os campos em snake_case (Python padrão)

- `artifactId` → `artifact_id`
- `userApiKey` → `user_api_key`
- `ifMatch` → `if_match`
- `model_version_id` → `version_id` (mais claro)

### FASE 4: Refatoração de Dependências

#### 4.1 Simplificar sistema de dependências

**Ação**: Remover funções helper desnecessárias

```python
# ANTES (ruim)
def _get_version_repository_internal(db: Session) -> VersionRepository:
    return SQLAlchemyVersionRepository(db)

def get_version_repository(db: Session = Depends(get_db)) -> VersionRepository:
    return _get_version_repository_internal(db)

# DEPOIS (bom)
def get_version_repository(db: Session = Depends(get_db)) -> VersionRepository:
    """Get version repository instance"""
    return SQLAlchemyVersionRepository(db)
```

#### 4.2 Padronizar uso de dependências

**Regra**: Todos os endpoints recebem `db` via `Depends(get_db)` diretamente

**Ação**: Atualizar todos os endpoints para receber `db` explicitamente

```python
# Padrão unificado
@router.get("/processes")
def list_processes(db: Session = Depends(get_db)):
    use_case = get_list_processes_use_case(db)
    version_repo = get_version_repository(db)
    # ...
```

#### 4.3 Remover dependências com `db: Session = None`

**Ação**: Todas as funções de dependência devem receber `db` via `Depends(get_db)`

- Remover lógica `if db is None: db = next(get_db())`
- Simplificar todas as funções

### FASE 5: Limpeza de Código

#### 5.1 Remover arquivos vazios ou desnecessários

- Deletar `app/api_schemas/` completamente
- Popular `app/api/v1/__init__.py` com exports úteis ou removê-lo se não necessário

#### 5.2 Consolidar imports

**Ação**: Criar `app/api/schemas/__init__.py` com re-exports organizados

```python
# app/api/schemas/__init__.py
from .common import BPMNJSON, BPMNElement, SequenceFlow, Lane
from .processes import ProcessResponse, ProcessCreateRequest, ProcessUpdateRequest
from .folders import FolderResponse, FolderCreateRequest, FolderUpdateRequest, FolderTree
from .spaces import SpaceTreeResponse, SpaceSummary, RecentItem
from .versions import VersionResponse, VersionCreateRequest, VersionHistoryItem
from .bpmn_operations import (
    GenerateRequest, GenerateResponse,
    EditRequest, EditResponse,
    ExportRequest, ExportResponse
)
from .governance import ConflictError

__all__ = [
    # Common
    "BPMNJSON", "BPMNElement", "SequenceFlow", "Lane",
    # Processes
    "ProcessResponse", "ProcessCreateRequest", "ProcessUpdateRequest",
    # Folders
    "FolderResponse", "FolderCreateRequest", "FolderUpdateRequest", "FolderTree",
    # Spaces
    "SpaceTreeResponse", "SpaceSummary", "RecentItem",
    # Versions
    "VersionResponse", "VersionCreateRequest", "VersionHistoryItem",
    # BPMN Operations
    "GenerateRequest", "GenerateResponse",
    "EditRequest", "EditResponse",
    "ExportRequest", "ExportResponse",
    # Governance
    "ConflictError",
]
```

#### 5.3 Atualizar `app/api/__init__.py`

**Ação**: Simplificar para apenas re-exports

```python
# app/api/__init__.py
"""
API Module - Re-exports all API schemas and types
"""
from app.api.schemas import (
    BPMNJSON, ProcessResponse, FolderResponse,
    GenerateRequest, GenerateResponse,
    EditRequest, EditResponse,
    # ... todos os schemas
)

__all__ = [
    # Re-export tudo de schemas
    *__all__  # De schemas/__init__.py
]
```

### FASE 6: Melhorias de Validação

#### 6.1 Adicionar validação consistente

**Ação**: Adicionar validação em todos os schemas de request

- `ProcessCreateRequest`: validar `name` (min_length=1, max_length=255)
- `GenerateRequest`: validar `artifact_ids` (min_items=1)
- `EditRequest`: validar `command` (min_length=1)
- Todos os IDs: validar formato UUID

#### 6.2 Adicionar documentação consistente

**Ação**: Todos os schemas devem ter docstrings e Field descriptions

### FASE 7: Testes e Validação

#### 7.1 Verificar imports

**Ação**: Garantir que todos os imports estão corretos após refatoração

#### 7.2 Verificar OpenAPI docs

**Ação**: Verificar que documentação OpenAPI está correta

#### 7.3 Testes de integração

**Ação**: Executar testes para garantir que nada quebrou

---

## 📊 RESUMO DAS MUDANÇAS

### Arquivos a Criar:
1. `app/api/schemas/__init__.py`
2. `app/api/schemas/common.py`
3. `app/api/schemas/processes.py` (movido de `api/processes.py`)
4. `app/api/schemas/folders.py` (merge de `api/hierarchy.py` + schemas de folders)
5. `app/api/schemas/spaces.py` (movido de `api/spaces.py`)
6. `app/api/schemas/versions.py` (movido de `api/versioning.py`)
7. `app/api/schemas/bpmn_operations.py` (novo, consolidando Generate/Edit/Export)
8. `app/api/schemas/governance.py` (movido de `api/governance.py`)

### Arquivos a Modificar:
1. `app/api/__init__.py` - Simplificar para re-exports
2. `app/api/v1/__init__.py` - Adicionar exports úteis ou remover
3. `app/api/v1/router.py` - Verificar imports
4. Todos os `app/api/v1/endpoints/*.py` - Atualizar imports de schemas
5. `app/core/dependencies.py` - Simplificar funções helper
6. `app/application/**/*.py` - Atualizar imports se necessário

### Arquivos a Deletar:
1. `app/api_schemas/` - Pasta inteira (vazia)
2. `app/api/processes.py` - Movido para `schemas/processes.py`
3. `app/api/spaces.py` - Movido para `schemas/spaces.py`
4. `app/api/hierarchy.py` - Mergeado em `schemas/folders.py`
5. `app/api/versioning.py` - Movido para `schemas/versions.py`
6. `app/api/governance.py` - Movido para `schemas/governance.py`

### Benefícios Esperados:
1. ✅ Zero duplicação de schemas
2. ✅ Estrutura clara e intuitiva
3. ✅ Fácil localizar qualquer schema
4. ✅ Imports consistentes
5. ✅ Manutenção simplificada
6. ✅ Menos bugs por inconsistências
7. ✅ Melhor documentação OpenAPI
8. ✅ Código mais testável

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

1. **FASE 1**: Criar estrutura de pastas `schemas/`
2. **FASE 2**: Consolidar schemas duplicados
3. **FASE 3**: Mover schemas existentes para `schemas/`
4. **FASE 4**: Atualizar todos os imports
5. **FASE 5**: Simplificar dependências
6. **FASE 6**: Padronizar nomenclatura
7. **FASE 7**: Adicionar validações
8. **FASE 8**: Limpar arquivos antigos
9. **FASE 9**: Testes e validação final

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Quebrar imports existentes
**Mitigação**: Usar busca e substituição sistemática, testar após cada fase

### Risco 2: Perder schemas durante migração
**Mitigação**: Criar checklist de todos os schemas antes de começar

### Risco 3: Inconsistências temporárias
**Mitigação**: Fazer mudanças em branch separada, testar completamente antes de merge

---

## 📝 CHECKLIST DE VALIDAÇÃO FINAL

- [ ] Todos os schemas estão em `app/api/schemas/`
- [ ] Nenhum schema duplicado
- [ ] Todos os imports atualizados
- [ ] Nomenclatura consistente (PascalCase para classes, snake_case para campos)
- [ ] Dependências simplificadas
- [ ] Pasta `api_schemas/` removida
- [ ] Arquivos antigos removidos
- [ ] OpenAPI docs funcionando
- [ ] Testes passando
- [ ] Linter sem erros
- [ ] Documentação atualizada

