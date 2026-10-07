from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_advocate
from app.core.db import get_session
from app.core.security import create_access_token, hash_password, verify_password
from app.models import Advocate, UserRole, UserStatus
from app.schemas import AccessTokenRead, AuthRead, LoginCreate, PasswordChange, SignupCreate, SignupRead

router = APIRouter(prefix="/auth", tags=["authentication"])
PENDING_MESSAGE = "Aapka account successfully register ho gaya hai. Admin activation ke baad aap login kar payenge."
APPROVAL_MESSAGE = "Aapka mobile number abhi admin dwara approve nahi hua hai. Kripya admin se sampark karein."


@router.post("/signup", response_model=SignupRead, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupCreate, session: AsyncSession = Depends(get_session)) -> SignupRead:
    phone = payload.phone.strip()
    email = payload.email.strip().lower()
    existing = await session.scalar(select(Advocate.id).where(or_(Advocate.phone == phone, Advocate.email == email)))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mobile number or email is already registered")
    advocate = Advocate(
        full_name=payload.full_name.strip(),
        phone=phone,
        email=email,
        chamber_address=payload.chamber_address.strip(),
        password_hash=hash_password(payload.password),
        role=UserRole.ADVOCATE,
        status=UserStatus.PENDING_APPROVAL,
    )
    session.add(advocate)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mobile number or email is already registered") from error
    return SignupRead(message=PENDING_MESSAGE, status=advocate.status)


@router.post("/login", response_model=AuthRead)
async def login(payload: LoginCreate, session: AsyncSession = Depends(get_session)) -> AuthRead:
    advocate = await session.scalar(select(Advocate).where(Advocate.phone == payload.phone.strip()))
    if advocate is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid mobile number or password")
    if advocate.status is not UserStatus.APPROVED or not advocate.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=APPROVAL_MESSAGE)
    if not verify_password(payload.password, advocate.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid mobile number or password")
    return AuthRead(
        access_token=create_access_token(advocate.id, advocate.token_version),
        must_change_password=advocate.must_change_password,
        user=advocate,
    )


@router.post("/change-password", response_model=AccessTokenRead)
async def change_password(
    payload: PasswordChange,
    advocate: Advocate = Depends(get_current_advocate),
    session: AsyncSession = Depends(get_session),
) -> AccessTokenRead:
    if not verify_password(payload.current_password, advocate.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    advocate.password_hash = hash_password(payload.new_password)
    advocate.must_change_password = False
    advocate.token_version += 1
    advocate.updated_at = datetime.now(timezone.utc)
    await session.commit()
    return AccessTokenRead(access_token=create_access_token(advocate.id, advocate.token_version))
