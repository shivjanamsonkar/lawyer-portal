import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_super_admin
from app.core.db import get_session
from app.core.security import hash_password
from app.models import Advocate, UserStatus
from app.schemas import AccountStatusUpdate, AdvocateAccountRead, TemporaryPasswordRead

router = APIRouter(prefix="/admin", tags=["administration"])


@router.get("/users", response_model=list[AdvocateAccountRead])
async def list_users(
    _: Advocate = Depends(require_super_admin),
    session: AsyncSession = Depends(get_session),
) -> list[Advocate]:
    result = await session.scalars(select(Advocate).order_by(Advocate.created_at.desc()))
    return list(result)


@router.put("/users/{user_id}/status", response_model=AdvocateAccountRead)
async def update_user_status(
    user_id: UUID,
    payload: AccountStatusUpdate,
    admin: Advocate = Depends(require_super_admin),
    session: AsyncSession = Depends(get_session),
) -> Advocate:
    user = await session.get(Advocate, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id and payload.status is not UserStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot disable or reject your own account")
    user.status = payload.status
    user.is_active = payload.status is not UserStatus.DISABLED
    user.approved_by = admin.id if payload.status is UserStatus.APPROVED else None
    user.approved_at = datetime.now(timezone.utc) if payload.status is UserStatus.APPROVED else None
    user.token_version += 1
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password", response_model=TemporaryPasswordRead)
async def reset_user_password(
    user_id: UUID,
    _: Advocate = Depends(require_super_admin),
    session: AsyncSession = Depends(get_session),
) -> TemporaryPasswordRead:
    user = await session.get(Advocate, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    temporary_password = secrets.token_urlsafe(18)
    user.password_hash = hash_password(temporary_password)
    user.must_change_password = True
    user.token_version += 1
    await session.commit()
    return TemporaryPasswordRead(temporary_password=temporary_password)
