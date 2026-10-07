import uuid
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, hash_password
from app.core.db import get_session
from main import app
from app.models import Advocate, Base, UserRole, UserStatus

TEST_PASSWORD = "ChambersTest123!"


@pytest_asyncio.fixture
async def client() -> AsyncIterator[tuple[AsyncClient, uuid.UUID]]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    advocate_id = uuid.uuid4()

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with sessions() as session:
        session.add(Advocate(
            id=advocate_id,
            full_name="A. Mehra",
            email="mehra@example.test",
            phone="+911234567890",
            password_hash=hash_password(TEST_PASSWORD),
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.APPROVED,
        ))
        await session.commit()

    async def override_session() -> AsyncIterator[AsyncSession]:
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
            test_client.headers["Authorization"] = f"Bearer {create_access_token(advocate_id)}"
            yield test_client, advocate_id
    finally:
        app.dependency_overrides.clear()
        await engine.dispose()