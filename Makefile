.PHONY: help setup install compose-up compose-down compose-logs compose-restart api-dev web-dev test lint format clean

.DEFAULT_GOAL := help

help: ## Mostra esta mensagem de ajuda
	@echo "ProcessLab - Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ========================================
# Setup & Installation
# ========================================

setup: install db-migrate ## Setup completo do projeto (instala deps + migrations)
	@echo "✅ Setup completo! Use 'make compose-up' para iniciar."

install: install-python install-node ## Instala todas as dependências

install-python: ## Instala dependências Python
	@echo "📦 Instalando dependências Python..."
	python3 -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r apps/api/requirements.txt
	@echo "✅ Dependências Python instaladas!"

install-node: ## Instala dependências Node.js
	@echo "📦 Instalando dependências Node.js..."
	pnpm install
	@echo "✅ Dependências Node.js instaladas!"

# ========================================
# Docker Compose (modo mais fácil!)
# ========================================

compose-up: ## 🚀 Sobe TUDO (web, api, worker, db, minio) em background
	@echo "🚀 Iniciando todos os serviços..."
	docker compose -f infra/compose/docker-compose.yml up -d
	@echo "✅ Serviços iniciados!"
	@echo "📍 API: http://localhost:8000/docs"
	@echo "📍 Web: http://localhost:3004"
	@echo "📍 MinIO Console: http://localhost:9001 (minio/minio123)"

compose-up-build: ## 🔨 Sobe tudo reconstruindo as imagens
	docker compose -f infra/compose/docker-compose.yml up -d --build

compose-down: ## 🛑 Para e limpa todos os containers
	docker compose -f infra/compose/docker-compose.yml down

compose-down-v: ## 🗑️  Para e REMOVE volumes (limpa banco)
	docker compose -f infra/compose/docker-compose.yml down -v

compose-logs: ## 📋 Mostra logs de todos os serviços
	docker compose -f infra/compose/docker-compose.yml logs -f

compose-logs-api: ## 📋 Mostra logs apenas da API
	docker compose -f infra/compose/docker-compose.yml logs -f api

compose-restart: ## 🔄 Reinicia todos os serviços
	docker compose -f infra/compose/docker-compose.yml restart

compose-restart-api: ## 🔄 Reinicia apenas a API
	docker compose -f infra/compose/docker-compose.yml restart api

compose-ps: ## 📊 Status dos containers
	docker compose -f infra/compose/docker-compose.yml ps

# ========================================
# Development Local (sem Docker)
# ========================================

api-dev: ## 🐍 Roda a API Python localmente com hot-reload
	@echo "🐍 Iniciando API em http://localhost:8000"
	cd apps/api && ../../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web-dev: ## ⚛️  Roda o frontend Next.js localmente
	@echo "⚛️  Iniciando Web em http://localhost:3000"
	cd apps/web && pnpm dev

# ========================================
# Testing
# ========================================

test: test-api test-web ## 🧪 Roda todos os testes

test-api: ## 🧪 Roda testes da API
	@echo "🧪 Testando API..."
	cd apps/api && ../../.venv/bin/pytest tests/ -v

test-web: ## 🧪 Roda testes do frontend
	@echo "🧪 Testando Web..."
	cd apps/web && pnpm test --run

test-e2e: compose-up ## 🧪 Roda teste end-to-end completo
	@echo "🧪 Aguardando serviços iniciarem..."
	@sleep 10
	python3 scripts/test_sprint2.py

test-watch: ## 👀 Roda testes em modo watch
	cd apps/api && ../../.venv/bin/pytest tests/ --watch

# ========================================
# Linting & Formatting
# ========================================

lint: lint-api lint-web ## 🔍 Roda linters em todo o projeto

lint-api: ## 🔍 Roda linter no código Python
	cd apps/api && ../../.venv/bin/ruff check app/ tests/

lint-web: ## 🔍 Roda linter no código TypeScript
	cd apps/web && pnpm lint

format: format-api format-web ## ✨ Formata todo o código

format-api: ## ✨ Formata código Python com ruff
	cd apps/api && ../../.venv/bin/ruff check --fix app/ tests/ && ../../.venv/bin/ruff format app/ tests/

format-web: ## ✨ Formata código TypeScript
	cd apps/web && pnpm format

# ========================================
# Database
# ========================================

db-migrate: ## 🗄️  Aplica migrations pendentes
	cd apps/api && ../../.venv/bin/alembic upgrade head

db-migration: ## 🗄️  Cria nova migration (use: make db-migration MSG="description")
	cd apps/api && ../../.venv/bin/alembic revision --autogenerate -m "$(MSG)"

db-rollback: ## ⏪ Reverte última migration
	cd apps/api && ../../.venv/bin/alembic downgrade -1

db-reset: compose-down-v compose-up db-migrate ## 🔄 Reset completo do banco
	@echo "✅ Banco resetado!"

# ========================================
# Schemas
# ========================================

generate-schemas: ## 📋 Re-gera tipos TypeScript e Pydantic a partir do schema JSON
	cd packages/shared-schemas && pnpm run generate

# ========================================
# Cleanup
# ========================================

clean: ## 🧹 Limpa arquivos temporários e caches
	@echo "🧹 Limpando caches..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	cd apps/web && rm -rf .next 2>/dev/null || true
	@echo "✅ Limpeza concluída!"

clean-all: clean compose-down-v ## 🧹 Limpa TUDO (caches + Docker volumes)
	@echo "✅ Limpeza completa concluída!"

# ========================================
# Atalhos úteis
# ========================================

dev: compose-up ## 🚀 Alias para compose-up
	@echo "💡 Dica: Use 'make compose-logs' para ver os logs"

start: compose-up ## 🚀 Alias para compose-up

stop: compose-down ## 🛑 Alias para compose-down

restart: compose-restart ## 🔄 Alias para compose-restart

logs: compose-logs ## 📋 Alias para compose-logs

ps: compose-ps ## 📊 Alias para compose-ps
