from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Advocate
from app.schemas import AdvocateCreate, AdvocateRead

router = APIRouter(prefix="/advocates", tags=["advocates"])


@router.get("", response_model=list[AdvocateRead])
async def list_advocates(session: AsyncSession = Depends(get_session)) -> list[Advocate]:
    result = await session.scalars(select(Advocate).order_by(Advocate.full_name))
    return list(result)


@router.post("", response_model=AdvocateRead, status_code=status.HTTP_201_CREATED)
async def create_advocate(payload: AdvocateCreate, session: AsyncSession = Depends(get_session)) -> Advocate:
    advocate = Advocate(**payload.model_dump())
    session.add(advocate)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="An advocate with that email or phone already exists") from error
    await session.refresh(advocate)
    return advocate