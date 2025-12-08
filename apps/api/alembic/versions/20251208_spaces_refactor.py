"""Add space-scoped columns and organization membership table

Revision ID: spaces_refactor
Revises: fix_projects_nullable_org
Create Date: 2025-12-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "spaces_refactor"
down_revision = "fix_projects_nullable_org"
branch_labels = None
depends_on = None


def upgrade():
    # --- Space columns on folders -------------------------------------------------
    op.add_column(
        "folders",
        sa.Column("organization_id", sa.String(length=36), sa.ForeignKey("organizations.id"), nullable=True),
    )
    op.add_column(
        "folders",
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=True),
    )
    op.alter_column(
        "folders",
        "project_id",
        existing_type=sa.String(length=36),
        nullable=True,
    )
    op.create_index("ix_folders_organization_id", "folders", ["organization_id"])
    op.create_index("ix_folders_user_id", "folders", ["user_id"])

    # --- Space columns on processes ----------------------------------------------
    op.add_column(
        "processes",
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=True),
    )
    op.alter_column(
        "processes",
        "project_id",
        existing_type=sa.String(length=36),
        nullable=True,
    )
    op.create_index("ix_processes_user_id", "processes", ["user_id"])
    op.create_index("ix_processes_organization_id", "processes", ["organization_id"])

    # --- Organization membership (many-to-many) ----------------------------------
    op.create_table(
        "organization_members",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "organization_id",
            sa.String(length=36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="viewer"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("invited_by", sa.String(length=36), sa.ForeignKey("users.id"), nullable=True),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )
    op.create_index(
        "ix_org_members_org_id", "organization_members", ["organization_id"]
    )
    op.create_index("ix_org_members_user_id", "organization_members", ["user_id"])


def downgrade():
    op.drop_index("ix_org_members_user_id", table_name="organization_members")
    op.drop_index("ix_org_members_org_id", table_name="organization_members")
    op.drop_table("organization_members")

    op.drop_index("ix_processes_organization_id", table_name="processes")
    op.drop_index("ix_processes_user_id", table_name="processes")
    op.alter_column(
        "processes",
        "project_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )
    op.drop_column("processes", "user_id")

    op.drop_index("ix_folders_user_id", table_name="folders")
    op.drop_index("ix_folders_organization_id", table_name="folders")
    op.alter_column(
        "folders",
        "project_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )
    op.drop_column("folders", "user_id")
    op.drop_column("folders", "organization_id")

