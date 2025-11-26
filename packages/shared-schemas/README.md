# Shared Schemas

This package contains the source of truth for ProcessLab's BPMN JSON format.

## Structure

- `src/bpmn_json.schema.json` - JSON Schema definition (source of truth)
- `src/types.ts` - Auto-generated TypeScript interfaces
- `src/models.py` - Auto-generated Pydantic models

## Code Generation

To regenerate TypeScript and Python models from the schema:

```bash
pnpm install
pnpm run generate
```

This will:
1. Generate TypeScript types in `src/types.ts`
2. Generate Pydantic models in `src/models.py`

## Usage

### TypeScript (Frontend)
```typescript
import type { BPMN_JSON } from '@processlab/shared-schemas';
```

### Python (Backend)
```python
from packages.shared_schemas.src.models import BPMNJSON
```

## Schema Updates

When updating `bpmn_json.schema.json`:
1. Edit the schema file
2. Run `pnpm run generate` to regenerate types
3. Commit both the schema and generated files
