import uuid
from uuid import UUID

from httpx import AsyncClient


async def test_client_crud(client: tuple[AsyncClient, UUID]) -> None:
    http, advocate_id = client
    created = await http.post("/api/clients", json={"advocate_id": str(advocate_id), "name": "Nisha Kapoor", "phone": "+919876543210", "email": "nisha@example.test", "address": "Delhi"})
    assert created.status_code == 201
    client_id = created.json()["id"]
    assert (await http.get(f"/api/clients/{client_id}")).json()["name"] == "Nisha Kapoor"
    updated = await http.put(f"/api/clients/{client_id}", json={"advocate_id": str(advocate_id), "name": "Nisha K.", "phone": "+919876543210"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Nisha K."
    assert (await http.delete(f"/api/clients/{client_id}")).status_code == 204
    assert (await http.get(f"/api/clients/{client_id}")).status_code == 404


async def test_case_payment_and_balance_flow(client: tuple[AsyncClient, UUID]) -> None:
    http, advocate_id = client
    response = await http.post("/api/cases", json={
        "advocate_id": str(advocate_id), "case_number": "CS/184/2026", "court_name": "Delhi High Court",
        "petitioner": "Arjun Sharma", "respondent": "Ravi Mehta", "agreed_fee": "50000.00",
    })
    assert response.status_code == 201
    case_id = response.json()["id"]
    payment = await http.post(f"/api/cases/{case_id}/payments", json={"amount_paid": "12500.00", "payment_mode": "UPI"})
    assert payment.status_code == 201
    assert payment.json()["payment_mode"] == "UPI"
    balance = await http.get(f"/api/cases/{case_id}/payments/balance")
    assert balance.status_code == 200
    assert balance.json() == {"agreed_fee": "50000.00", "received_amount": "12500.00", "pending_balance": "37500.00"}
    assert (await http.get("/api/cases/not-a-uuid")).status_code == 422


async def test_cnr_must_contain_16_characters(client: tuple[AsyncClient, UUID]) -> None:
    http, advocate_id = client
    response = await http.post("/api/cases", json={
        "advocate_id": str(advocate_id), "cnr_number": "TOO-SHORT", "case_number": "CS/1/2026",
        "court_name": "Delhi High Court", "petitioner": "A", "respondent": "B",
    })
    assert response.status_code == 422


async def test_missing_case_returns_404(client: tuple[AsyncClient, UUID]) -> None:
    http, _ = client
    assert (await http.get(f"/api/cases/{uuid.uuid4()}")).status_code == 404
