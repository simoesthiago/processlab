# ProcessLab

**AI-Powered BPMN Process Modeling Platform**

ProcessLab is a modern BPMN (Business Process Model and Notation) modeling tool that uses multimodal AI to automatically generate, edit, and optimize business process diagrams from documents, images, and natural language.

## 🏗️ Architecture Overview

ProcessLab is built as a monorepo with the following structure:

```
processlab/
├── apps/
│   ├── api/          # FastAPI backend (Python)
│   ├── web/          # Next.js frontend (TypeScript)
│   └── eval/         # Evaluation & testing
├── packages/
│   ├── shared-schemas/  # BPMN JSON schema (source of truth)
│   ├── clients/         # API clients
│   ├── prompts/         # LLM prompts
│   └── telemetry/       # Observability
├── infra/
│   └── compose/      # Docker Compose configurations
└── docs/             # Documentation
```

## 🎯 Key Features

- **Multimodal Ingestion**: Upload PDFs, Word documents, images, or text
- **AI-Powered Generation**: Multiagent system synthesizes BPMN from documents
- **Natural Language Editing**: Edit diagrams using plain English commands
- **Automatic Layout**: ELK.js-powered hierarchical layout for pools and lanes
- **Multiple Export Formats**: XML (BPMN 2.0), PNG, JSON
- **Real-time Linting**: Validates diagrams against BPMN best practices

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd processlab
   ```

2. **Install dependencies**
   ```bash
   # Install Python dependencies
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r apps/api/requirements.txt

   # Install Node dependencies
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run services**

   **Option A: Using Makefile (recommended)**
   ```bash
   # Start all services with Docker Compose
   make compose-up

   # Or run services individually:
   make api-dev   # Run API locally (requires activated .venv)
   make web-dev   # Run frontend locally
   ```

   **Option B: Manual**
   ```bash
   # Terminal 1: API
   source .venv/bin/activate
   uvicorn apps.api.app.main:app --reload

   # Terminal 2: Frontend
   cd apps/web
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3004
   - API Docs: http://localhost:8000/docs
   - API Health: http://localhost:8000/health

## 📊 Data Flow

```
User Upload (PDF/DOCX/Image)
    ↓
[Ingest API] → Object Storage (MinIO/S3)
    ↓
[RAG System] → Vector DB (embeddings)
    ↓
[Multiagent Orchestration] → LLM Agents
    ↓
BPMN_JSON (Internal Format) ← Source of Truth
    ↓
[Editor] → bpmn-js visualization
    ↓
[Export] → XML/PNG/JSON
```

## 🏛️ Architecture Guidelines

### 1. JSON-First Internal Format

> **Guideline**: The editor always operates on the `BPMN_JSON` internal format and converts to XML only at export/visualization time.

**Rationale** (cite PRD: 166):
- JSON is easier to manipulate programmatically
- Serves as single source of truth
- XML is generated on-demand for compatibility

**Implementation**:
- Schema: `packages/shared-schemas/src/bpmn_json.schema.json`
- TypeScript types: Auto-generated from schema
- Python models: Auto-generated Pydantic models

### 2. ELK.js for Automatic Layout

> **Guideline**: Use ELK.js layered algorithm for automatic layout of pools and lanes.

**Rationale** (cite PRD: 149):
- Handles hierarchical structures (pools/lanes)
- Produces professional-looking diagrams
- Reduces manual positioning effort

**Implementation**:
- Layout module: `apps/web/src/features/bpmn/layout/`
- Applied before visualization
- Configurable spacing and direction

### 3. BYOK Security Pattern

> **Guideline**: Implement "Bring Your Own Key" pattern. User API keys are NEVER logged or persisted.

**Rationale** (cite Architecture: 523):
- Users maintain control of their LLM API keys
- Reduces security liability
- Enables usage-based billing transparency

**Implementation**:
- API keys passed in request headers
- Used only for request duration
- Explicit logging guards in code
- No database persistence

## 📦 Packages

### `@processlab/shared-schemas`

Source of truth for BPMN data structures.

**Key Files**:
- `src/bpmn_json.schema.json` - JSON Schema definition
- `src/types.ts` - Auto-generated TypeScript interfaces
- `src/models.py` - Auto-generated Pydantic models

**Code Generation**:
```bash
cd packages/shared-schemas
pnpm run generate  # Regenerates TypeScript and Python models
```

## 🔌 API Endpoints

### `POST /api/v1/ingest`
Upload documents for BPMN extraction (max 30MB).

**Supported formats**: PDF, DOCX, DOC, PNG, JPG, TXT

### `POST /api/v1/generate`
Generate BPMN from uploaded artifacts using AI.

**Input**: Artifact IDs + optional prompt  
**Output**: BPMN_JSON structure

### `POST /api/v1/edit`
Edit BPMN using natural language commands.

**Example**: "Add a user task called 'Review Document' after the start event"

### `POST /api/v1/export`
Export BPMN to different formats.

**Formats**: `xml` (BPMN 2.0), `png` (image), `json` (internal)

## 🧩 Frontend Features

### BPMN Editor (`apps/web/src/features/bpmn/`)

**Modules**:
- `editor/` - Main editor component using bpmn-js
- `layout/` - ELK.js automatic layout
- `linting/` - BPMN validation rules
- `io/` - Import/export utilities (JSON ↔ XML)
- `sync/` - Real-time collaboration (future)

**Usage**:
```tsx
import { BpmnEditor } from '@/features/bpmn';

<BpmnEditor
  initialBpmn={bpmnData}
  onChange={(updated) => console.log(updated)}
/>
```

## 🛠️ Makefile Commands

| Command | Description |
|---------|-------------|
| `make compose-up` | Start all services (web, api, worker, db, minio) |
| `make compose-down` | Stop and clean all services |
| `make api-dev` | Run API locally with hot-reload |
| `make web-dev` | Run Next.js frontend locally |

## 🧪 Testing

```bash
# API tests
cd apps/api
pytest tests/

# Frontend tests
cd apps/web
pnpm test
```

## 📝 Development Workflow

1. **Schema Changes**: Edit `packages/shared-schemas/src/bpmn_json.schema.json`
2. **Regenerate Types**: Run `pnpm run generate` in shared-schemas
3. **Update API**: Modify endpoints in `apps/api/app/api/v1/`
4. **Update Frontend**: Modify components in `apps/web/src/`
5. **Test**: Run tests and verify in browser
6. **Commit**: Commit schema + generated files together

## 🔐 Security

- **BYOK Pattern**: User API keys never logged or stored
- **File Upload Limits**: 30MB maximum per upload
- **CORS**: Configured for localhost development
- **Input Validation**: Pydantic models validate all API inputs

## 📚 Additional Documentation

- [PRD](docs/PRD.md) - Product Requirements Document
- [Code Architecture](docs/code_architecture.md) - Detailed architecture decisions
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)

## 🤝 Contributing

1. Follow the architecture guidelines above
2. Ensure all tests pass
3. Update documentation for new features
4. Regenerate types when changing schemas

## 📄 License

[License information]

---

**Built with**: FastAPI • Next.js • bpmn-js • ELK.js • LangChain • LangGraph
