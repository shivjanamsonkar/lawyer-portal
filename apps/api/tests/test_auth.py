from uuid import UUID

from httpx import AsyncClient

from conftest import TEST_PASSWORD

SIGNUP = {
    "full_name": "Nisha Kapoor",
    "phone": "+919876543211",
    "email": "nisha@example.test",
    "chamber_address": "New Delhi",
    "password": "AdvocateSecure123!",
}


async def test_signup_creates_pending_account_and_blocks_login(client: tuple[AsyncClient, UUID]) -> None:
    http, _ = client
    signup = await http.post("/api/auth/signup", json=SIGNUP)

    assert signup.status_code == 201
    assert signup.json()["status"] == "PENDING_APPROVAL"
    assert "Admin activation" in signup.json()["message"]
    assert "password_hash" not in signup.json()

    login = await http.post("/api/auth/login", json={"phone": SIGNUP["phone"], "password": SIGNUP["password"]})
    assert login.status_code == 403
    assert "approve nahi hua" in login.json()["detail"]


async def test_approved_user_can_login(client: tuple[AsyncClient, UUID]) -> None:
    http, _ = client
    login = await http.post("/api/auth/login", json={"phone": "+911234567890", "password": TEST_PASSWORD})

    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"
    assert login.json()["user"]["status"] == "APPROVED"
