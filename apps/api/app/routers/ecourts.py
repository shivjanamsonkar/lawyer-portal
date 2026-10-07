import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_portal_advocate
from app.core.db import get_session
from app.models import Advocate, Case
from app.workers.scraper import sync_case_from_ecourts

router = APIRouter(prefix="/ecourts", tags=["eCourts"])


class SyncRequest(BaseModel):
    case_id: uuid.UUID
    cnr_number: str = Field(min_length=16, max_length=16)


@router.post("/sync", status_code=202)
async def queue_sync(
    payload: SyncRequest,
    advocate: Advocate = Depends(get_portal_advocate),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    case = await session.scalar(select(Case).where(Case.id == payload.case_id, Case.advocate_id == advocate.id))
    if case is None or case.cnr_number != payload.cnr_number:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    try:
        task = sync_case_from_ecourts.delay(str(payload.case_id), payload.cnr_number)
    except Exception as error:
        raise HTTPException(status_code=503, detail="Court sync worker is unavailable") from error
    return {"task_id": task.id, "status": "queued"}