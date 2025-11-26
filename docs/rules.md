# BPMappr - Regras de Desenvolvimento e Segurança

## 🔐 Segurança

### 1. NUNCA logar segredos
- **PROIBIDO**: Logar API keys, tokens, senhas ou qualquer credencial
- **PADRÃO BYOK**: User API keys devem ser usadas apenas durante o request e NUNCA persistidas
- **Exemplo correto**:
  ```python
  if user_api_key:
      logger.info("Using user-provided API key (BYOK)")
      # NEVER: logger.info(f"API key: {user_api_key}")
  ```

### 2. Rate Limiting
- **OBRIGATÓRIO**: Todas as rotas públicas devem ter rate limiting
- **CRÍTICO**: Endpoints do copiloto devem ter limites mais restritos
- **Implementação**: Usar middleware de rate limiting no FastAPI

### 3. Validação de Entrada
- **OBRIGATÓRIO**: Validar todos os inputs com Pydantic models
- **Tamanho máximo**: 30MB para uploads de arquivos
- **MIME types**: Validar tipos de arquivo permitidos

### 4. CORS e TrustedHost
- **Desenvolvimento**: Permitir localhost:3000
- **Produção**: Configurar domínios específicos
- **Implementação**: Usar middlewares do FastAPI

## 🏗️ Arquitetura

### 5. Formato JSON Interno
- **REGRA**: Editar SEMPRE no formato BPMN_JSON interno
- **XML**: Converter para BPMN XML APENAS no momento do export/visualização
- **Justificativa** (PRD:166): JSON é mais fácil de manipular programaticamente

### 6. Schema como Source of Truth
- **ÚNICO SCHEMA**: `packages/shared-schemas/src/bpmn_json.schema.json`
- **Auto-geração**: Tipos TypeScript e modelos Pydantic são gerados automaticamente
- **PROIBIDO**: Criar tipos manualmente divergentes do schema

### 7. Layout Automático
- **OBRIGATÓRIO**: Usar ELK.js para layout de pools e lanes
- **Justificativa** (PRD:149): Produz diagramas profissionais sem esforço manual
- **Implementação**: `apps/web/src/features/bpmn/layout/`

## 📦 Código

### 8. Monorepo Discipline
- **Imports**: Usar imports relativos dentro de apps, absolute entre packages
- **Shared Code**: Código compartilhado vai em `packages/`, não em `apps/`
- **Dependências**: Cada app/package tem seu próprio `package.json` ou `requirements.txt`

### 9. Commits Atômicos de Schema
- **REGRA**: Ao alterar o schema, commitar junto com os tipos gerados
- **Ordem**: 
  1. Editar `bpmn_json.schema.json`
  2. Rodar `pnpm run generate`
  3. Commitar schema + types.ts + models.py juntos

### 10. Testes
- **OBRIGATÓRIO**: Testes para toda lógica de negócio
- **Cobertura mínima**: 70% para código crítico (geração, edição, RAG)
- **Fixtures**: Usar fixtures realistas baseados no schema

## 🔄 RAG e AI

### 11. Rastreabilidade de Citações
- **OBRIGATÓRIO**: Todo elemento gerado deve ter `meta.sourceArtifactId`
- **Transparência**: Usuário deve poder visualizar de onde veio cada elemento
- **Formato**: Usar campo `meta` no BPMN_JSON

### 12. Prompt Management
- **Centralizado**: Todos os prompts em `packages/prompts/`
- **Versionamento**: Prompts devem ser versionados
- **Templates**: Usar Jinja2 para templates de prompts

### 13. Multiagente
- **Orquestração**: Usar LangGraph para orquestração de agentes
- **Isolamento**: Cada agente deve ter responsabilidade única
- **Estado**: Compartilhar estado via LangGraph state

## 🚨 Error Handling

### 14. Erros Informativos
- **HTTP Status**: Usar códigos HTTP apropriados
- **Mensagens**: Mensagens de erro devem ser claras e acionáveis
- **Logging**: Logar erros com contexto suficiente (sem segredos!)

### 15. Graceful Degradation
- **Fallbacks**: Ter fallbacks para serviços externos
- **Timeouts**: Configurar timeouts apropriados
- **Retry Logic**: Implementar retry com backoff exponencial

## 📊 Observabilidade

### 16. Structured Logging
- **Formato**: JSON structured logs em produção
- **Contexto**: Incluir request_id em todos os logs
- **Níveis**: INFO para operações normais, ERROR para falhas, DEBUG para desenvolvimento

### 17. Métricas
- **Latência**: Medir latência de todos os endpoints
- **Contadores**: Contar requests, erros, uploads
- **Custom**: Métricas de qualidade BPMN (GED, RGED)

## 🎨 Frontend

### 18. Componentes Isolados
- **Feature-based**: Organizar por feature, não por tipo de arquivo
- **Reusabilidade**: Componentes devem ser reutilizáveis
- **Props**: Usar TypeScript interfaces para props

### 19. Estado Global Mínimo
- **Local First**: Preferir estado local quando possível
- **Compartilhado**: Usar Context/Zustand apenas para estado global
- **Sincronização**: Bpmn-js é source of truth do editor

### 20. Performance
- **Lazy Loading**: Carregar bpmn-js de forma lazy
- **Memoization**: Usar React.memo para componentes pesados
- **Virtual Scrolling**: Para listas grandes (histórico, artifacts)

## 🚀 Deploy

### 21. Environment Variables
- **OBRIGATÓRIO**: Todas as configs via variáveis de ambiente
- **PROIBIDO**: Hardcoding de URLs, credenciais, etc
- **Validação**: Validar env vars no startup

### 22. Health Checks
- **OBRIGATÓRIO**: Endpoint `/health` em todos os serviços
- **Dependências**: Health check deve verificar DB, storage, etc
- **Formato**: Retornar status + versão

### 23. Migrations
- **Versionadas**: Usar Alembic para migrations versionadas
- **Reversíveis**: Toda migration deve ter downgrade
- **Testadas**: Testar migrations em staging antes de produção

## ⚡ Performance

### 24. Database
- **Indexes**: Criar indexes para queries frequentes
- **N+1**: Evitar queries N+1 com eager loading
- **Pooling**: Usar connection pooling

### 25. Caching
- **RAG**: Cachear embeddings de documentos
- **Layout**: Cachear resultados do ELK.js
- **Invalidação**: Implementar invalidação de cache apropriada

---

**IMPORTANTE**: Estas regras são parte do contrato de qualidade do projeto. 
Violações devem ser justificadas em code review e documentadas como ADRs quando apropriado.
