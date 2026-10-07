import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_portal_advocate
from app.core.db import get_session
from app.models import Advocate, Case, Client
from app.schemas import CaseCreate, CaseRead

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=list[CaseRead])
async def list_cases(
    cnr_number: str | None = Query(default=None),
    client_name: str | None = Query(default=None),
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> list[Case]:
    query = select(Case).outerjoin(Client, Case.client_id == Client.id).where(Case.advocate_id == advocate.id)
    if cnr_number:
        query = query.where(Case.cnr_number == cnr_number)
    if client_name:
        query = query.where(Client.name.ilike(f"%{client_name}%"))
    result = await session.scalars(query.order_by(Case.next_hearing_date.nulls_last()))
    return list(result)


@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreate,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Case:
    if payload.client_id is not None:
        client = await session.scalar(select(Client).where(Client.id == payload.client_id, Client.advocate_id == advocate.id))
        if client is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    case = Case(**payload.model_dump(exclude={"advocate_id"}), advocate_id=advocate.id)
    session.add(case)
    await session.commit()
    await session.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseRead)
async def get_case(
    case_id: uuid.UUID,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Case:
    case = await session.scalar(select(Case).where(Case.id == case_id, Case.advocate_id == advocate.id))
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}", response_model=CaseRead)
async def update_case(
    case_id: uuid.UUID,
    payload: CaseCreate,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Case:
    case = await session.scalar(select(Case).where(Case.id == case_id, Case.advocate_id == advocate.id))
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    if payload.client_id is not None:
        client = await session.scalar(select(Client).where(Client.id == payload.client_id, Client.advocate_id == advocate.id))
        if client is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    for field, value in payload.model_dump(exclude={"advocate_id"}).items():
        setattr(case, field, value)
    await session.commit()
    await session.refresh(case)
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: uuid.UUID,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Response:
    case = await session.scalar(select(Case).where(Case.id == case_id, Case.advocate_id == advocate.id))
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    await session.delete(case)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)