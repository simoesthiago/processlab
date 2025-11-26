.PHONY: compose-up compose-down api-dev web-dev test lint format help

help: ## Mostra esta mensagem de ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ========================================
# Docker Compose
# ========================================

compose-up: ## Sobe web, api, worker, db, minio
	docker compose -f infra/compose/docker-compose.yml up --build

compose-down: ## Para e limpa tudo
	docker compose -f infra/compose/docker-compose.yml down -v

# ========================================
# Development
# ========================================

api-dev: ## Roda a API Python localmente com hot-reload (requer ativação do .venv)
	source .venv/bin/activate && PYTHONPATH=apps/api uvicorn app.main:app --reload

web-dev: ## Roda o frontend Next.js localmente
	cd apps/web && pnpm dev

# ========================================
# Testing
# ========================================

test: ## Roda todos os testes
	@echo "Running API tests..."
	cd apps/api && source ../../.venv/bin/activate && PYTHONPATH=. pytest tests/ -v
	@echo "Running web tests..."
	cd apps/web && pnpm test --run

test-api: ## Roda testes da API
	cd apps/api && source ../../.venv/bin/activate && PYTHONPATH=. pytest tests/ -v

test-web: ## Roda testes do frontend
	cd apps/web && pnpm test --run

test-watch: ## Roda testes em modo watch
	cd apps/api && source ../../.venv/bin/activate && PYTHONPATH=. pytest tests/ --watch

# ========================================
# Linting & Formatting
# ========================================

lint: lint-api lint-web ## Roda linters em todo o projeto

lint-api: ## Roda linter no código Python
	cd apps/api && source ../../.venv/bin/activate && ruff check app/ tests/

lint-web: ## Roda linter no código TypeScript
	cd apps/web && pnpm lint

format: format-api format-web ## Formata todo o código

format-api: ## Formata código Python com ruff
	cd apps/api && source ../../.venv/bin/activate && ruff check --fix app/ tests/ && ruff format app/ tests/

format-web: ## Formata código TypeScript
	cd apps/web && pnpm format

# ========================================
# Database
# ========================================

db-migrate: ## Cria e aplica migrations do banco
	cd apps/api && source ../../.venv/bin/activate && alembic upgrade head

db-migration: ## Cria nova migration (use: make db-migration MSG="description")
	cd apps/api && source ../../.venv/bin/activate && alembic revision --autogenerate -m "$(MSG)"

db-rollback: ## Reverte última migration
	cd apps/api && source ../../.venv/bin/activate && alembic downgrade -1

# ========================================
# Schemas
# ========================================

generate-schemas: ## Re-gera tipos TypeScript e Pydantic a partir do schema JSON
	cd packages/shared-schemas && pnpm run generate

# ========================================
# Cleanup
# ========================================

clean: ## Limpa arquivos temporários e caches
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	cd apps/web && rm -rf .next

