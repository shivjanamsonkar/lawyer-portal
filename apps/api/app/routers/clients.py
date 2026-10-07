import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_portal_advocate
from app.core.db import get_session
from app.models import Advocate, Client
from app.schemas import ClientCreate, ClientRead

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientRead])
async def list_clients(
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> list[Client]:
    result = await session.scalars(select(Client).where(Client.advocate_id == advocate.id).order_by(Client.name))
    return list(result)


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Client:
    client = Client(**payload.model_dump(exclude={"advocate_id"}), advocate_id=advocate.id)
    session.add(client)
    await session.commit()
    await session.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientRead)
async def get_client(
    client_id: uuid.UUID,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Client:
    client = await session.scalar(select(Client).where(Client.id == client_id, Client.advocate_id == advocate.id))
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: uuid.UUID,
    payload: ClientCreate,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Client:
    client = await session.scalar(select(Client).where(Client.id == client_id, Client.advocate_id == advocate.id))
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in payload.model_dump(exclude={"advocate_id"}).items():
        setattr(client, field, value)
    await session.commit()
    await session.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Response:
    client = await session.scalar(select(Client).where(Client.id == client_id, Client.advocate_id == advocate.id))
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    await session.delete(client)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)