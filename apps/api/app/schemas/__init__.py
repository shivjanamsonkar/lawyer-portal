import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models import UserRole, UserStatus


class ClientCreate(BaseModel):
    advocate_id: uuid.UUID | None = None
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=20)
    email: str | None = None
    address: str | None = None


class AdvocateCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str = Field(min_length=1, max_length=20)


class AdvocateRead(AdvocateCreate):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SignupCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=7, max_length=20)
    email: str = Field(min_length=3, max_length=255)
    chamber_address: str = Field(min_length=1, max_length=2000)
    password: str = Field(min_length=12, max_length=128)


class LoginCreate(BaseModel):
    phone: str = Field(min_length=1, max_length=20)
    password: str = Field(min_length=1, max_length=128)


class AdvocateAccountRead(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    email: str
    chamber_address: str | None
    role: UserRole
    status: UserStatus
    is_active: bool
    must_change_password: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SignupRead(BaseModel):
    message: str
    status: UserStatus


class AuthRead(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    must_change_password: bool
    user: AdvocateAccountRead


class AccessTokenRead(BaseModel):
    access_token: str


class AccountStatusUpdate(BaseModel):
    status: Literal[UserStatus.APPROVED, UserStatus.REJECTED, UserStatus.DISABLED]


class TemporaryPasswordRead(BaseModel):
    temporary_password: str
    must_change_password: bool = True


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class ClientRead(ClientCreate):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CaseCreate(BaseModel):
    advocate_id: uuid.UUID | None = None
    client_id: uuid.UUID | None = None
    cnr_number: str | None = Field(default=None, min_length=16, max_length=16)
    case_number: str = Field(min_length=1, max_length=100)
    court_name: str = Field(min_length=1, max_length=255)
    court_room: str | None = None
    judge_name: str | None = None
    petitioner: str = Field(min_length=1, max_length=255)
    respondent: str = Field(min_length=1, max_length=255)
    case_type: str = "Civil"
    stage: str = "Pending"
    next_hearing_date: date | None = None
    agreed_fee: Decimal = Field(default=Decimal("0.00"), ge=0)
    preparation_notes: str | None = None


class CaseRead(CaseCreate):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(BaseModel):
    amount_paid: Decimal = Field(gt=0)
    payment_mode: Literal["UPI", "Cash", "Bank Transfer", "Cheque"]
    notes: str | None = None


class PaymentRead(PaymentCreate):
    id: uuid.UUID
    case_id: uuid.UUID
    payment_date: datetime
    model_config = ConfigDict(from_attributes=True)


class LedgerRead(BaseModel):
    case_id: uuid.UUID
    case_number: str
    petitioner: str
    respondent: str
    client_name: str | None
    client_phone: str | None
    agreed_fee: Decimal
    received_amount: Decimal
    pending_balance: Decimal