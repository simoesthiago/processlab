"""Fix projects organization_id to be nullable for personal projects

Revision ID: fix_projects_nullable_org
Revises: add_governance_models
Create Date: 2025-12-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_projects_nullable_org'
down_revision = 'add_governance_models'
branch_labels = None
depends_on = None


def upgrade():
    # Make organization_id nullable in projects table
    # This is needed for personal projects which don't belong to an organization
    op.alter_column('projects', 'organization_id',
                    existing_type=sa.String(length=36),
                    nullable=True)


def downgrade():
    # Note: This will fail if there are projects with NULL organization_id
    op.alter_column('projects', 'organization_id',
                    existing_type=sa.String(length=36),
                    nullable=False)

