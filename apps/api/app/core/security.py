from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, encoded: str) -> bool:
    if not encoded:
        return False
    return password_hash.verify(password, encoded)


def create_access_token(advocate_id: UUID, token_version: int = 0) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_minutes)
    return jwt.encode({"sub": str(advocate_id), "ver": token_version, "exp": expires_at}, settings.jwt_secret_key, algorithm="HS256")


def decode_access_token(token: str) -> tuple[UUID, int]:
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    return UUID(payload["sub"]), int(payload.get("ver", 0))