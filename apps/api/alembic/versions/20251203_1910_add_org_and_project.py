"""Add Organization and Project models

Revision ID: add_org_and_project
Revises: 511059801598
Create Date: 2025-12-03 19:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_org_and_project'
down_revision = '511059801598'
branch_labels = None
depends_on = None


def upgrade():
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('settings', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('settings', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add organization_id to users (nullable for migration, existing users can be assigned later)
    op.add_column('users', sa.Column('organization_id', sa.String(length=36), nullable=True))
    op.add_column('users', sa.Column('role', sa.String(length=50), nullable=True))
    op.create_foreign_key('fk_users_organization', 'users', 'organizations', ['organization_id'], ['id'])
    
    # Add project_id to processes (nullable for migration, will need data migration script)
    op.add_column('processes', sa.Column('project_id', sa.String(length=36), nullable=True))
    
    # Update organization_id in processes to be a foreign key (it was nullable String before)
    op.alter_column('processes', 'organization_id',
                    existing_type=sa.String(length=36),
                    nullable=True)  # Keep nullable for migration
    op.create_foreign_key('fk_processes_organization', 'processes', 'organizations', ['organization_id'], ['id'])
    op.create_foreign_key('fk_processes_project', 'processes', 'projects', ['project_id'], ['id'])
    
    # Create indexes for performance
    op.create_index('ix_projects_organization_id', 'projects', ['organization_id'])
    op.create_index('ix_processes_project_id', 'processes', ['project_id'])
    op.create_index('ix_processes_organization_id', 'processes', ['organization_id'])
    op.create_index('ix_users_organization_id', 'users', ['organization_id'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_users_organization_id', table_name='users')
    op.drop_index('ix_processes_organization_id', table_name='processes')
    op.drop_index('ix_processes_project_id', table_name='processes')
    op.drop_index('ix_projects_organization_id', table_name='projects')
    
    # Remove foreign keys
    op.drop_constraint('fk_processes_project', 'processes', type_='foreignkey')
    op.drop_constraint('fk_processes_organization', 'processes', type_='foreignkey')
    op.drop_constraint('fk_users_organization', 'users', type_='foreignkey')
    
    # Remove columns
    op.drop_column('processes', 'project_id')
    op.drop_column('users', 'role')
    op.drop_column('users', 'organization_id')
    
    # Drop tables
    op.drop_table('projects')
    op.drop_table('organizations')
