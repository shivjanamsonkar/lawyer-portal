from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import decode_access_token
from app.models import Advocate, UserRole, UserStatus

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_advocate(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> Advocate:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        advocate_id, token_version = decode_access_token(credentials.credentials)
    except (InvalidTokenError, ValueError, KeyError):
        raise unauthorized from None
    advocate = await session.get(Advocate, advocate_id)
    if advocate is None or not advocate.is_active or advocate.status is not UserStatus.APPROVED or advocate.token_version != token_version:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not approved")
    return advocate


async def require_super_admin(advocate: Advocate = Depends(get_current_advocate)) -> Advocate:
    if advocate.must_change_password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Password change required")
    if advocate.role is not UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return advocate


async def get_portal_advocate(advocate: Advocate = Depends(get_current_advocate)) -> Advocate:
    if advocate.must_change_password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Password change required")
    return advocate