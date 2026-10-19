"""Create the initial hosted administrator from one-time deployment settings.

This runs before the API starts. It only creates an administrator when none
exists and never changes an existing account or password. Remove the
BOOTSTRAP_ADMIN_* environment variables from the host after first login.
"""

import asyncio

from sqlalchemy import select

from app.core.bootstrap_admin import provision_admin
from app.core.config import settings
from app.core.db import SessionLocal, engine
from app.models import Advocate, UserRole


async def main() -> None:
    values = (
        settings.bootstrap_admin_name,
        settings.bootstrap_admin_phone,
        settings.bootstrap_admin_email,
        settings.bootstrap_admin_password,
    )
    if not any(values):
        print("Hosted administrator bootstrap is not configured; skipping.")
        return
    if not all(values):
        raise SystemExit("Configure all BOOTSTRAP_ADMIN_* values or remove them all")

    full_name, phone, email, password = values
    if len(password) < 12:
        raise SystemExit("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters")

    try:
        async with SessionLocal() as session:
            existing = await session.scalar(
                select(Advocate).where(Advocate.role == UserRole.SUPER_ADMIN)
            )
            if existing is not None:
                print("Hosted administrator already exists; no account changes made.")
                return
            outcome = await provision_admin(
                session,
                full_name=full_name,
                phone=phone,
                email=email,
                password=password,
                reset_existing=False,
            )
        print(outcome)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
