"""Add folders table and project hierarchy improvements

Revision ID: add_folders_hierarchy
Revises: 20251206_fix_projects_nullable_org
Create Date: 2024-12-06

This migration adds:
- Folder table for organizing processes within projects
- folder_id column to processes table
- position column to processes for ordering
- is_default column to projects for default "Drafts" project
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_folders_hierarchy'
# Fix chain: previous revision id is "fix_projects_nullable_org"
down_revision = 'fix_projects_nullable_org'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create folders table
    op.create_table(
        'folders',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('project_id', sa.String(36), sa.ForeignKey('projects.id'), nullable=False, index=True),
        sa.Column('parent_folder_id', sa.String(36), sa.ForeignKey('folders.id'), nullable=True, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('position', sa.Integer, default=0),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, default=datetime.utcnow, nullable=False),
        sa.Column('updated_at', sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False),
        sa.Column('deleted_at', sa.DateTime, nullable=True),
    )
    
    # Add folder_id and position to processes table
    op.add_column('processes', sa.Column('folder_id', sa.String(36), sa.ForeignKey('folders.id'), nullable=True, index=True))
    op.add_column('processes', sa.Column('position', sa.Integer, default=0))
    
    # Make organization_id nullable in processes (for personal projects)
    op.alter_column('processes', 'organization_id', nullable=True)
    
    # Add is_default column to projects
    op.add_column('projects', sa.Column('is_default', sa.Boolean, default=False))
    
    # Create index for folder hierarchy queries
    op.create_index('ix_folders_project_parent', 'folders', ['project_id', 'parent_folder_id'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_folders_project_parent', 'folders')
    
    # Remove is_default from projects
    op.drop_column('projects', 'is_default')
    
    # Remove folder_id and position from processes
    op.drop_column('processes', 'position')
    op.drop_column('processes', 'folder_id')
    
    # Drop folders table
    op.drop_table('folders')

