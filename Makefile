.PHONY: compose-up compose-down api-dev web-dev

compose-up: ## Sobe web, api, worker, db, minio
	docker compose -f infra/compose/docker-compose.yml up --build

compose-down: ## Para e limpa tudo
	docker compose -f infra/compose/docker-compose.yml down -v

api-dev: ## Roda a API Python localmente com hot-reload (requer ativação do .venv)
	source .venv/bin/activate && uvicorn apps.api.app.main:app --reload

web-dev: ## Roda o frontend Next.js localmente
	cd apps/web && pnpm dev

