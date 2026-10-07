import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_portal_advocate
from app.core.db import get_session
from app.models import Advocate, Case, Client, Payment
from app.schemas import LedgerRead, PaymentCreate, PaymentRead

router = APIRouter(tags=["payments"])


@router.get("/ledger", response_model=list[LedgerRead])
async def get_ledger(
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, object]]:
    received = func.coalesce(func.sum(Payment.amount_paid), 0).label("received_amount")
    query = (
        select(Case, Client.name, Client.phone, received)
        .outerjoin(Client, Case.client_id == Client.id)
        .outerjoin(Payment, Payment.case_id == Case.id)
        .where(Case.advocate_id == advocate.id)
        .group_by(Case.id, Client.id)
        .order_by(Case.case_number)
    )
    rows = (await session.execute(query)).all()
    return [
        {
            "case_id": case.id,
            "case_number": case.case_number,
            "petitioner": case.petitioner,
            "respondent": case.respondent,
            "client_name": client_name,
            "client_phone": client_phone,
            "agreed_fee": case.agreed_fee,
            "received_amount": Decimal(received_amount or 0),
            "pending_balance": case.agreed_fee - Decimal(received_amount or 0),
        }
        for case, client_name, client_phone, received_amount in rows
    ]


@router.get("/cases/{case_id}/payments", response_model=list[PaymentRead])
async def list_payments(
    case_id: uuid.UUID,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> list[Payment]:
    result = await session.scalars(
        select(Payment).join(Case).where(Case.id == case_id, Case.advocate_id == advocate.id).order_by(Payment.payment_date.desc())
    )
    return list(result)


@router.post("/cases/{case_id}/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
async def create_payment(
    case_id: uuid.UUID,
    payload: PaymentCreate,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> Payment:
    case = await session.scalar(select(Case).where(Case.id == case_id, Case.advocate_id == advocate.id))
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    payment = Payment(case_id=case_id, **payload.model_dump())
    session.add(payment)
    await session.commit()
    await session.refresh(payment)
    return payment


@router.get("/cases/{case_id}/payments/balance")
async def get_balance(
    case_id: uuid.UUID,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Decimal]:
    case = await session.scalar(select(Case).where(Case.id == case_id, Case.advocate_id == advocate.id))
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    received = await session.scalar(select(func.coalesce(func.sum(Payment.amount_paid), 0)).where(Payment.case_id == case_id))
    received_amount = Decimal(received or 0)
    return {"agreed_fee": case.agreed_fee, "received_amount": received_amount, "pending_balance": case.agreed_fee - received_amount}