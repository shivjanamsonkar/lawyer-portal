"""Add account approval and authentication fields."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_user_auth_approval"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


user_role = postgresql.ENUM("SUPER_ADMIN", "ADVOCATE", "ASSOCIATE", name="user_role")
user_status = postgresql.ENUM("PENDING_APPROVAL", "APPROVED", "REJECTED", "DISABLED", name="user_status")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    user_role.create(bind, checkfirst=True)
    user_status.create(bind, checkfirst=True)

    def add_column_if_missing(table: str, column: sa.Column) -> None:
        if column.name not in {item["name"] for item in inspector.get_columns(table)}:
            op.add_column(table, column)

    add_column_if_missing("advocates", sa.Column("chamber_address", sa.Text(), nullable=True))
    add_column_if_missing("advocates", sa.Column("password_hash", sa.String(255), server_default="", nullable=False))
    add_column_if_missing("advocates", sa.Column("role", user_role, server_default="ADVOCATE", nullable=False))
    add_column_if_missing("advocates", sa.Column("status", user_status, server_default="PENDING_APPROVAL", nullable=False))
    add_column_if_missing("advocates", sa.Column("approved_by", postgresql.UUID(as_uuid=True), nullable=True))
    add_column_if_missing("advocates", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    add_column_if_missing("advocates", sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False))
    add_column_if_missing("advocates", sa.Column("must_change_password", sa.Boolean(), server_default=sa.false(), nullable=False))
    add_column_if_missing("advocates", sa.Column("token_version", sa.Integer(), server_default="0", nullable=False))
    add_column_if_missing("advocates", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    add_column_if_missing("clients", sa.Column("address", sa.Text(), nullable=True))
    add_column_if_missing("cases", sa.Column("case_type", sa.String(50), server_default="Civil", nullable=False))

    foreign_keys = inspector.get_foreign_keys("advocates")
    if not any("approved_by" in item.get("constrained_columns", []) for item in foreign_keys):
        op.create_foreign_key("fk_advocates_approved_by", "advocates", "advocates", ["approved_by"], ["id"], ondelete="SET NULL")
    if not inspector.has_table("hearing_reminders"):
        op.create_table(
            "hearing_reminders",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
            sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
            sa.Column("kind", sa.String(20), nullable=False),
            sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("sent_at", sa.DateTime(timezone=True)),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_error", sa.Text()),
            sa.UniqueConstraint("case_id", "kind", "scheduled_at", name="uq_hearing_reminder_schedule"),
        )


def downgrade() -> None:
    pass