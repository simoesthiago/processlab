# Alembic Migrations

This directory contains database migrations for ProcessLab.

## Usage

### Create a new migration

```bash
cd apps/api
alembic revision --autogenerate -m "description of changes"
```

### Apply migrations

```bash
cd apps/api
alembic upgrade head
```

### Rollback migration

```bash
cd apps/api
alembic downgrade -1
```

## Important Notes

- Always review auto-generated migrations before applying
- Test migrations in development before production
- Ensure migrations are reversible (have proper downgrade)
- Keep migrations small and focused

## Sprint 1 Status

Migrations directory is set up but no initial migration has been created yet.
This will be done in Sprint 2 when database integration is implemented.
