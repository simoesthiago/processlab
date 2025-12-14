"""Add slug to organizations and sharing models

Revision ID: add_slug_and_sharing
Revises: ad9e6c41c55f
Create Date: 2025-12-04 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from slugify import slugify
import uuid

# revision identifiers, used by Alembic.
revision = 'add_slug_and_sharing'
down_revision = 'ad9e6c41c55f'
branch_labels = None
depends_on = None


def generate_uuid():
    return str(uuid.uuid4())


def upgrade():
    # Add slug column to organizations
    op.add_column('organizations', sa.Column('slug', sa.String(length=255), nullable=True))
    
    # Generate slugs for existing organizations
    connection = op.get_bind()
    organizations = connection.execute(sa.text("SELECT id, name FROM organizations")).fetchall()
    
    for org_id, name in organizations:
        slug = slugify(name)
        # Ensure uniqueness
        base_slug = slug
        counter = 1
        while True:
            existing = connection.execute(
                sa.text("SELECT id FROM organizations WHERE slug = :slug AND id != :org_id"),
                {"slug": slug, "org_id": org_id}
            ).fetchone()
            if not existing:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        connection.execute(
            sa.text("UPDATE organizations SET slug = :slug WHERE id = :org_id"),
            {"slug": slug, "org_id": org_id}
        )
    
    # Make slug required and unique
    op.alter_column('organizations', 'slug', nullable=False)
    op.create_unique_constraint('uq_organizations_slug', 'organizations', ['slug'])
    op.create_index('ix_organizations_slug', 'organizations', ['slug'])
    
    # Add visibility and owner_id to projects for personal projects
    op.add_column('projects', sa.Column('visibility', sa.String(length=20), nullable=True, server_default='organization'))
    op.add_column('projects', sa.Column('owner_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_projects_owner', 'projects', 'users', ['owner_id'], ['id'])
    
    # Create project_shares table
    op.create_table(
        'project_shares',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id'), nullable=False),
        sa.Column('owner_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        
        # Who it's shared with
        sa.Column('shared_with_email', sa.String(length=255), nullable=True),
        sa.Column('shared_with_user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=True),
        
        # Public link sharing
        sa.Column('share_token', sa.String(length=64), unique=True, nullable=True),
        sa.Column('is_public_link', sa.Boolean(), default=False),
        
        # Permission level
        sa.Column('permission', sa.String(length=20), nullable=False),  # viewer, commenter, editor
        
        # Expiration
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        
        # Soft delete
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
    )
    
    # Create indexes for project_shares
    op.create_index('ix_project_shares_project_id', 'project_shares', ['project_id'])
    op.create_index('ix_project_shares_shared_with_user_id', 'project_shares', ['shared_with_user_id'])
    op.create_index('ix_project_shares_share_token', 'project_shares', ['share_token'])
    op.create_index('ix_project_shares_owner_id', 'project_shares', ['owner_id'])
    

def downgrade():
    # Drop project_shares indexes and table
    op.drop_index('ix_project_shares_owner_id', table_name='project_shares')
    op.drop_index('ix_project_shares_share_token', table_name='project_shares')
    op.drop_index('ix_project_shares_shared_with_user_id', table_name='project_shares')
    op.drop_index('ix_project_shares_project_id', table_name='project_shares')
    op.drop_table('project_shares')
    
    # Remove projects columns
    op.drop_constraint('fk_projects_owner', 'projects', type_='foreignkey')
    op.drop_column('projects', 'owner_id')
    op.drop_column('projects', 'visibility')
    
    # Remove organizations slug
    op.drop_index('ix_organizations_slug', table_name='organizations')
    op.drop_constraint('uq_organizations_slug', 'organizations', type_='unique')
    op.drop_column('organizations', 'slug')

