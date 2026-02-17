# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Implementation Plan

**[`implementation_plan.md`](./implementation_plan.md)** tracks all pending work for this project.

Before starting any new feature or fix, read that file to understand:
- What tasks are already planned and their current status (`[ ]` to do, `[~]` in progress, `[x]` done)
- Dependencies between tasks (e.g., Task 1.1 must be done before 1.2 and 2.2)
- Which files each task touches

**When you complete a task**, update `implementation_plan.md`:
1. Change `[ ]` → `[x]` on the task checkbox
2. Move the task entry to the **Completed Tasks** section at the bottom
3. If you discover new work while implementing, add it as a new task in the appropriate phase

---

## Commands

### Docker (recommended)
```bash
make compose-up        # Start all services (web :3004, api :8000)
make compose-down      # Stop and remove containers
make compose-logs      # Tail all service logs
make compose-up-build  # Rebuild and start
```

### Local development
```bash
# API (requires .venv activated)
make api-dev           # uvicorn with --reload on :8000

# Web
make web-dev           # next dev on :3004
```

### Testing
```bash
make test-api                                                      # Run all API tests
make test-watch                                                    # pytest in watch mode
.venv/bin/pytest apps/api/tests/test_foo.py::test_bar_function -v # Single test
cd apps/web && pnpm test --run                                     # Run all web tests
```

### Linting & formatting
```bash
make lint-api          # ruff check app/ tests/
make format-api        # ruff check --fix && ruff format
cd apps/web && pnpm lint
```

### Setup from scratch
```bash
make setup             # Installs Python + Node deps, runs DB migrations
cp .env.example .env   # Then edit .env as needed
```

---

## Architecture

### Monorepo structure
```
apps/api/    — FastAPI backend (Python 3.11)
apps/web/    — Next.js 16 frontend (TypeScript, React 19)
packages/    — Shared schemas, clients, prompts (pnpm workspaces)
```

---

### Backend — Clean Architecture

The API follows strict layered separation. **Never skip layers** (e.g., no ORM queries in endpoints).

```
HTTP Request
  → apps/api/app/api/v1/endpoints/     (HTTP layer — thin, no logic)
  → apps/api/app/core/dependencies.py  (DI — assembles use cases with repos)
  → apps/api/app/application/          (Use cases — all business logic lives here)
  → apps/api/app/domain/               (Entities + Repository interfaces)
  → apps/api/app/infrastructure/       (SQLAlchemy repo implementations + AI services)
```

**Use case pattern** — every business operation follows this structure:
```python
# Command (input data)
class CreateProcessCommand:
    name: str
    folder_id: Optional[str]

# Use case (logic)
class CreateProcessUseCase:
    def __init__(self, process_repo: ProcessRepository, folder_repo: FolderRepository): ...
    def execute(self, command: CreateProcessCommand) -> Process: ...
```

**Dependency injection** — `app/core/dependencies.py` assembles use cases:
```python
def get_create_process_use_case(db: Session) -> CreateProcessUseCase:
    return CreateProcessUseCase(
        get_process_repository(db),
        get_folder_repository(db),
    )
```

**Repository pattern** — `domain/repositories/` defines abstract interfaces; `infrastructure/persistence/sqlalchemy/` implements them. Domain entities are pure dataclasses, completely decoupled from ORM models. Each SQLAlchemy repo has `_to_entity()` and `_to_orm()` conversion methods.

**Exception handling** — Raise `ResourceNotFoundError`, `ValidationError`, `AuthenticationError` etc. from `app/core/exceptions.py`. These are mapped to HTTP responses automatically in `setup_exception_handlers()`.

**Middleware ordering in `main.py` is critical** — CORS must be registered first (before custom middlewares) to handle preflight requests. Current order: CORS → RequestId → Logging → ErrorLogging → TrustedHost.

**Single-user mode** — All persistence uses a fixed `LOCAL_USER_ID = "local-user"`. No auth tokens are needed.

---

### Backend — BPMN Data Model

Two formats exist, each with a specific role:

- **BPMN_JSON** — Internal format stored in `ModelVersion.bpmn_json` (SQLite JSON column). This is the source of truth for AI operations and programmatic manipulation.
- **XML** — BPMN 2.0 standard format. Generated on-demand for the bpmn-js frontend renderer and for export. Stored in `ModelVersion.xml`.

Conversion between the two is handled in `app/infrastructure/services/bpmn/`.

**Version model** (`app/db/models.py`):
- `ModelVersion` has `parent_version_id` (self-referential), `version_number`, `etag` (for optimistic locking), `commit_message`, `change_type` (major/minor/patch).
- `ProcessModel.current_version_id` points to the active version.

---

### Frontend — State Management

**`SpacesContext`** (`src/contexts/SpacesContext.tsx`) is the central state store for the entire folder/process tree. It maintains a `trees: Record<spaceId, SpaceTree>` map. The private space tree is also persisted in `localStorage` as a fallback when the API is unreachable.

**`AuthContext`** (`src/contexts/AuthContext.tsx`) is a no-op in single-user mode — `isAuthenticated` is always `true`, the user is always `{ id: 'local-user' }`.

**`useProcess` / `useVersions`** are the two main hooks inside the BPMN Studio. `useProcess` manages the current process entity and its XML; `useVersions` manages the version list and save operations. Both live under `src/features/processes/hooks/`.

---

### Frontend — BPMN Editor

`BpmnEditor.tsx` wraps the bpmn-js library and exposes an imperative API via `forwardRef` + `useImperativeHandle`. The parent (`StudioContent.tsx`) holds a `editorRef = useRef<BpmnEditorRef>()` and calls methods like `editorRef.current.undo()`, `editorRef.current.getXml()`, `editorRef.current.applyFormatting(...)` directly.

The full `BpmnEditorRef` interface is defined at the top of `BpmnEditor.tsx` — add new capabilities there first, then implement in `useImperativeHandle`.

`FormatToolbar.tsx` polls `editorRef.current?.getSelectedElements()` every 200ms to keep the toolbar in sync with the canvas selection state.

---

### Frontend — API Client

All API calls go through `apiFetch<T>()` in `src/shared/services/api/client.ts`:
- Base URL: `NEXT_PUBLIC_API_URL` env var (default `http://127.0.0.1:8000`)
- Timeout: 10 seconds (AbortController)
- Throws `ApiError(message, status, data)` on non-2xx responses
- Pass `{ silent: true }` in options to suppress console logging (useful for background polls)
- No auth headers needed

---

### Frontend — Studio Page Composition

`StudioContent.tsx` is the root component of the BPMN editor page. It orchestrates:
- `BpmnEditor` (canvas, via ref)
- `StudioNavbar` (top bar with breadcrumbs, undo/redo, zoom, save, export)
- `FormatToolbar` (element formatting)
- `ProcessWizard` (AI chat panel, right side)
- `SaveVersionModal`, `ExportModal`, `SettingsModal`

State that threads through multiple children (e.g., `openAiKey`, `selectedElements`, `bpmnXml`) lives in `StudioContent` and is passed as props.

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `SQLITE_PATH` | `./processlab.db` | SQLite database file path |
| `STORAGE_PATH` | `./data_storage` | Uploaded file storage |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | API base URL for frontend |
| `LOG_LEVEL` | `INFO` | Backend log level |
| `JSON_LOGS` | `false` | Structured JSON logs (set `true` in prod) |

`OPENAI_API_KEY` in `.env` is **not used** at runtime — the app uses a BYOK (Bring Your Own Key) pattern where the key is passed per-request via the `X-OpenAI-API-Key` header. The backend reads it with `Header(None, alias="X-OpenAI-API-Key")` and it is automatically redacted from logs by `LoggingMiddleware`.
