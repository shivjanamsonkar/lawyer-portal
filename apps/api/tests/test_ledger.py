from uuid import UUID

from httpx import AsyncClient


async def test_payment_insertion_and_pending_balance(client: tuple[AsyncClient, UUID]) -> None:
    http, advocate_id = client
    created = await http.post("/api/cases", json={
        "advocate_id": str(advocate_id),
        "case_number": "LEDGER/1/2026",
        "court_name": "Delhi High Court",
        "petitioner": "Client One",
        "respondent": "Other Party",
        "agreed_fee": "50000.00",
    })
    assert created.status_code == 201
    case_id = created.json()["id"]

    payment = await http.post(f"/api/cases/{case_id}/payments", json={"amount_paid": "12500.00", "payment_mode": "UPI"})
    assert payment.status_code == 201
    balance = await http.get(f"/api/cases/{case_id}/payments/balance")
    assert balance.status_code == 200
    assert balance.json() == {"agreed_fee": "50000.00", "received_amount": "12500.00", "pending_balance": "37500.00"}

    ledger = await http.get("/api/ledger")
    matching = next(row for row in ledger.json() if row["case_id"] == case_id)
    assert matching["pending_balance"] == "37500.00"
