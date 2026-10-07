"""Create AdvocatePro core tables.

Revision ID: 0001_initial_schema
Revises:
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    if sa.inspect(op.get_bind()).has_table("advocates"):
        return
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.create_table(
        "advocates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("phone", sa.String(20), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("advocate_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("advocates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(255)),
        sa.Column("address", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("advocate_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("advocates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clients.id", ondelete="SET NULL")),
        sa.Column("cnr_number", sa.String(16), unique=True),
        sa.Column("case_number", sa.String(100), nullable=False),
        sa.Column("court_name", sa.String(255), nullable=False),
        sa.Column("court_room", sa.String(50)),
        sa.Column("judge_name", sa.String(255)),
        sa.Column("petitioner", sa.String(255), nullable=False),
        sa.Column("respondent", sa.String(255), nullable=False),
        sa.Column("case_type", sa.String(50), nullable=False, server_default="Civil"),
        sa.Column("stage", sa.String(100), nullable=False, server_default="Pending"),
        sa.Column("next_hearing_date", sa.Date()),
        sa.Column("agreed_fee", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("preparation_notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "payment_ledger",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount_paid", sa.Numeric(12, 2), nullable=False),
        sa.Column("payment_date", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("payment_mode", sa.String(50)),
        sa.Column("notes", sa.Text()),
    )
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