"""Add governance models: Invitation, ApiKey, SystemAuditLog, and etag

Revision ID: add_governance_models
Revises: add_slug_and_sharing
Create Date: 2025-12-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_governance_models'
down_revision = 'add_slug_and_sharing'
branch_labels = None
depends_on = None


def upgrade():
    # Add etag column to model_versions for optimistic locking
    op.add_column('model_versions', sa.Column('etag', sa.String(length=64), nullable=True))
    
    # Create invitations table
    op.create_table(
        'invitations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id'), nullable=False),
        
        # Invitation details
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='viewer'),
        
        # Token for invitation link
        sa.Column('token', sa.String(length=64), unique=True, nullable=False),
        
        # Status
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        
        # Who created/accepted
        sa.Column('invited_by', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('accepted_by_user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=True),
    )
    
    # Create indexes for invitations
    op.create_index('ix_invitations_organization_id', 'invitations', ['organization_id'])
    op.create_index('ix_invitations_email', 'invitations', ['email'])
    op.create_index('ix_invitations_token', 'invitations', ['token'])
    
    # Create api_keys table
    op.create_table(
        'api_keys',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        
        # Key identification
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('key_type', sa.String(length=50), nullable=False),
        
        # Security
        sa.Column('key_hash', sa.String(length=255), nullable=False),
        sa.Column('key_preview', sa.String(length=10), nullable=False),
        
        # Permissions
        sa.Column('scopes', sa.JSON(), nullable=True),
        
        # Status
        sa.Column('is_active', sa.Boolean(), default=True),
        
        # Usage tracking
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('usage_count', sa.Integer(), default=0),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
    )
    
    # Create indexes for api_keys
    op.create_index('ix_api_keys_organization_id', 'api_keys', ['organization_id'])
    op.create_index('ix_api_keys_user_id', 'api_keys', ['user_id'])
    
    # Create system_audit_logs table
    op.create_table(
        'system_audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id'), nullable=True),
        
        # Event details
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('event_category', sa.String(length=50), nullable=False),
        
        # Actor
        sa.Column('actor_user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('actor_email', sa.String(length=255), nullable=True),
        
        # Target
        sa.Column('target_type', sa.String(length=50), nullable=True),
        sa.Column('target_id', sa.String(length=36), nullable=True),
        sa.Column('target_email', sa.String(length=255), nullable=True),
        
        # Request context
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('request_id', sa.String(length=100), nullable=True),
        
        # Change details
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('before_state', sa.JSON(), nullable=True),
        sa.Column('after_state', sa.JSON(), nullable=True),
        
        # Timestamp
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    
    # Create indexes for system_audit_logs
    op.create_index('ix_system_audit_logs_organization_id', 'system_audit_logs', ['organization_id'])
    op.create_index('ix_system_audit_logs_event_type', 'system_audit_logs', ['event_type'])
    op.create_index('ix_system_audit_logs_created_at', 'system_audit_logs', ['created_at'])


def downgrade():
    # Drop system_audit_logs
    op.drop_index('ix_system_audit_logs_created_at', table_name='system_audit_logs')
    op.drop_index('ix_system_audit_logs_event_type', table_name='system_audit_logs')
    op.drop_index('ix_system_audit_logs_organization_id', table_name='system_audit_logs')
    op.drop_table('system_audit_logs')
    
    # Drop api_keys
    op.drop_index('ix_api_keys_user_id', table_name='api_keys')
    op.drop_index('ix_api_keys_organization_id', table_name='api_keys')
    op.drop_table('api_keys')
    
    # Drop invitations
    op.drop_index('ix_invitations_token', table_name='invitations')
    op.drop_index('ix_invitations_email', table_name='invitations')
    op.drop_index('ix_invitations_organization_id', table_name='invitations')
    op.drop_table('invitations')
    
    # Drop etag column
    op.drop_column('model_versions', 'etag')

