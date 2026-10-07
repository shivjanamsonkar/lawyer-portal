from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.bootstrap_admin import provision_admin
from app.core.security import hash_password, verify_password
from app.models import Advocate, Base, UserRole, UserStatus


@pytest.mark.asyncio
async def test_explicit_bootstrap_reset_rotates_admin_password_and_tokens() -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    try:
        async with sessions() as session:
            admin_id = uuid4()
            session.add(Advocate(
                id=admin_id,
                full_name="Demo Administrator",
                phone="+919900000001",
                email="admin@demo.advocatepro.test",
                password_hash=hash_password("OldPassword456!"),
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.APPROVED,
                is_active=True,
            ))
            await session.commit()
            with pytest.raises(SystemExit, match="RESET_BOOTSTRAP_ADMIN_PASSWORD=true"):
                await provision_admin(
                    session,
                    full_name="Demo Administrator",
                    phone="+919900000001",
                    email="admin@demo.advocatepro.test",
                    password="AdminDemo@2026!",
                )
            result = await provision_admin(
                session,
                full_name="Demo Administrator",
                phone="+919900000001",
                email="admin@demo.advocatepro.test",
                password="AdminDemo@2026!",
                reset_existing=True,
            )
            admin = await session.get(Advocate, admin_id)
            assert result == "Bootstrap administrator password reset."
            assert admin is not None
            assert verify_password("AdminDemo@2026!", admin.password_hash)
            assert admin.token_version == 1
            assert admin.must_change_password is False
    finally:
        await engine.dispose()
