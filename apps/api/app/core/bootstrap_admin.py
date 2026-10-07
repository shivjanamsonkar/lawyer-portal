import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.db import SessionLocal, engine
from app.core.security import hash_password
from app.models import Advocate, UserRole, UserStatus


async def provision_admin(
    session,
    *,
    full_name: str,
    phone: str,
    email: str,
    password: str,
    reset_existing: bool = False,
) -> str:
    email = email.lower()
    existing = await session.scalar(select(Advocate).where(Advocate.role == UserRole.SUPER_ADMIN))
    if existing is not None:
        if existing.phone != phone or existing.email.lower() != email:
            raise SystemExit("A different SUPER_ADMIN account already exists; refusing to modify it")
        if not reset_existing:
            raise SystemExit("A SUPER_ADMIN account already exists; set RESET_BOOTSTRAP_ADMIN_PASSWORD=true to reset this configured admin")
        existing.full_name = full_name
        existing.password_hash = hash_password(password)
        existing.status = UserStatus.APPROVED
        existing.is_active = True
        existing.must_change_password = False
        existing.token_version += 1
        await session.commit()
        return "Bootstrap administrator password reset."

    session.add(Advocate(
        full_name=full_name,
        phone=phone,
        email=email,
        password_hash=hash_password(password),
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.APPROVED,
        is_active=True,
    ))
    await session.commit()
    return "Bootstrap administrator created."


async def main() -> None:
    if settings.app_environment.lower() in {"prod", "production"}:
        raise SystemExit("Bootstrap administrator is a local setup operation and is disabled in production")
    full_name = settings.bootstrap_admin_name
    phone = settings.bootstrap_admin_phone
    email = settings.bootstrap_admin_email
    password = settings.bootstrap_admin_password
    if not all((full_name, phone, email, password)):
        raise SystemExit("Set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_PHONE, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD")
    if len(password) < 12:
        raise SystemExit("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters")
    async with SessionLocal() as session:
        outcome = await provision_admin(
            session,
            full_name=full_name,
            phone=phone,
            email=email,
            password=password,
            reset_existing=settings.reset_bootstrap_admin_password,
        )
    await engine.dispose()
    print(outcome)


if __name__ == "__main__":
    asyncio.run(main())
