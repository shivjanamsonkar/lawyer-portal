import asyncio
import os
from datetime import date, timedelta
from typing import Any

import httpx

DEMO_ADMIN_PHONE = "+919900000001"
DEMO_ADVOCATE_PHONE = "+919900000002"
DEMO_ADVOCATE_EMAIL = "asha@demo.advocatepro.test"
DEMO_ADVOCATE_PASSWORD = "AdvocateDemo@2026!"

CLIENTS: list[dict[str, Any]] = [
    {"name": "Nisha Kapoor", "phone": "+919811000101", "email": "nisha@example.test", "address": "South Delhi"},
    {"name": "Rohan Malhotra", "phone": "+919811000102", "email": "rohan@example.test", "address": "Gurugram, Haryana"},
    {"name": "Aster Textiles Pvt Ltd", "phone": "+919811000103", "email": "legal@aster.example.test", "address": "Connaught Place, New Delhi"},
]


async def _expect(response: httpx.Response, statuses: tuple[int, ...] = (200,)) -> dict[str, Any]:
    if response.status_code not in statuses:
        raise RuntimeError(f"API {response.request.method} {response.request.url.path} returned {response.status_code}: {response.text}")
    if response.status_code == 204:
        return {}
    return response.json()


async def _login(client: httpx.AsyncClient, phone: str, password: str) -> str:
    response = await client.post("/auth/login", json={"phone": phone, "password": password})
    data = await _expect(response)
    return str(data["access_token"])


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _ensure_approved_account(
    client: httpx.AsyncClient,
    admin_token: str,
    *,
    full_name: str,
    phone: str,
    email: str,
    password: str,
) -> None:
    headers = _auth(admin_token)
    users_response = await client.get("/admin/users", headers=headers)
    users = await _expect(users_response)
    user = next((item for item in users if item["phone"] == phone), None)

    if user is None:
        signup_response = await client.post("/auth/signup", json={
            "full_name": full_name,
            "phone": phone,
            "email": email,
            "chamber_address": "Mehra Legal Chambers, New Delhi",
            "password": password,
        })
        await _expect(signup_response, (201, 409))
        users_response = await client.get("/admin/users", headers=headers)
        users = await _expect(users_response)
        user = next((item for item in users if item["phone"] == phone), None)
        if user is None:
            raise RuntimeError(f"Signup completed but account {phone} was not returned by the admin API")

    if user["email"].lower() != email.lower():
        raise RuntimeError(f"Demo phone {phone} already belongs to a different email; refusing to modify it")
    if user["status"] != "APPROVED":
        status_response = await client.put(
            f"/admin/users/{user['id']}/status",
            headers=headers,
            json={"status": "APPROVED"},
        )
        await _expect(status_response)

    login_response = await client.post("/auth/login", json={"phone": phone, "password": password})
    if login_response.status_code == 200:
        return
    if login_response.status_code != 401:
        await _expect(login_response)

    reset_response = await client.post(f"/admin/users/{user['id']}/reset-password", headers=headers)
    reset = await _expect(reset_response)
    temporary_password = str(reset["temporary_password"])
    temporary_login = await client.post("/auth/login", json={"phone": phone, "password": temporary_password})
    temporary_session = await _expect(temporary_login)
    change_response = await client.post(
        "/auth/change-password",
        headers=_auth(str(temporary_session["access_token"])),
        json={"current_password": temporary_password, "new_password": password},
    )
    await _expect(change_response)


async def seed_demo_data(
    client: httpx.AsyncClient,
    *,
    admin_phone: str,
    admin_password: str,
    today: date | None = None,
) -> dict[str, Any]:
    today = today or date.today()
    admin_token = await _login(client, admin_phone, admin_password)
    await _ensure_approved_account(
        client,
        admin_token,
        full_name="Adv. Asha Mehra",
        phone=DEMO_ADVOCATE_PHONE,
        email=DEMO_ADVOCATE_EMAIL,
        password=DEMO_ADVOCATE_PASSWORD,
    )
    advocate_token = await _login(client, DEMO_ADVOCATE_PHONE, DEMO_ADVOCATE_PASSWORD)
    headers = _auth(advocate_token)

    current_clients = await _expect(await client.get("/clients", headers=headers))
    client_ids: dict[str, str] = {}
    for values in CLIENTS:
        existing = next((item for item in current_clients if item["phone"] == values["phone"]), None)
        if existing is None:
            result = await _expect(await client.post("/clients", headers=headers, json=values), (201,))
            current_clients.append(result)
            existing = result
        else:
            result = await _expect(await client.put(f"/clients/{existing['id']}", headers=headers, json=values))
            existing.update(result)
        client_ids[values["phone"]] = str(existing["id"])

    cases = [
        {
            "client_id": client_ids["+919811000101"], "cnr_number": "DLHC010000012026", "case_number": "CS/184/2026",
            "court_name": "Delhi High Court", "court_room": "Courtroom 4", "judge_name": "Justice Rao",
            "petitioner": "Nisha Kapoor", "respondent": "Ravi Mehta", "case_type": "Civil", "stage": "Arguments",
            "agreed_fee": "80000.00", "preparation_notes": "Review witness statements and prepare the hearing bundle.",
            "next_hearing_date": (today + timedelta(days=2)).isoformat(),
        },
        {
            "client_id": client_ids["+919811000102"], "cnr_number": "DLHC010000022026", "case_number": "CRL/092/2026",
            "court_name": "Saket District Court", "court_room": "Room 12", "judge_name": "Judge Bedi",
            "petitioner": "State", "respondent": "Rohan Malhotra", "case_type": "Criminal", "stage": "Evidence",
            "agreed_fee": "60000.00", "preparation_notes": "Confirm witness availability and review the latest filing.",
            "next_hearing_date": (today + timedelta(days=4)).isoformat(),
        },
        {
            "client_id": client_ids["+919811000103"], "cnr_number": "DLHC010000032026", "case_number": "COM/317/2026",
            "court_name": "NCLT New Delhi", "court_room": "Bench 2", "judge_name": "Member Sharma",
            "petitioner": "Aster Textiles Pvt Ltd", "respondent": "Northstar Imports Pvt Ltd", "case_type": "Commercial", "stage": "Directions",
            "agreed_fee": "125000.00", "preparation_notes": "Prepare the contract chronology and updated statement of claim.",
            "next_hearing_date": (today + timedelta(days=7)).isoformat(),
        },
    ]

    current_cases = await _expect(await client.get("/cases", headers=headers))
    case_ids: dict[str, str] = {}
    for payload in cases:
        existing = next((item for item in current_cases if item["cnr_number"] == payload["cnr_number"]), None)
        if existing is None:
            result = await _expect(await client.post("/cases", headers=headers, json=payload), (201,))
            current_cases.append(result)
            existing = result
        else:
            result = await _expect(await client.put(f"/cases/{existing['id']}", headers=headers, json=payload))
            existing.update(result)
        case_ids[payload["cnr_number"]] = str(existing["id"])

    payment_samples = [
        ("DLHC010000012026", "25000.00", "UPI", "Initial retainer"),
        ("DLHC010000012026", "10000.00", "Bank Transfer", "Second instalment"),
        ("DLHC010000022026", "20000.00", "Cash", "Consultation and filing fees"),
        ("DLHC010000032026", "50000.00", "Cheque", "Engagement payment"),
    ]
    for cnr_number, amount, mode, notes in payment_samples:
        case_id = case_ids[cnr_number]
        payments = await _expect(await client.get(f"/cases/{case_id}/payments", headers=headers))
        exists = any(
            item["amount_paid"] == amount and item["payment_mode"] == mode and item["notes"] == notes
            for item in payments
        )
        if not exists:
            await _expect(await client.post(
                f"/cases/{case_id}/payments",
                headers=headers,
                json={"amount_paid": amount, "payment_mode": mode, "notes": notes},
            ), (201,))

    ledger = await _expect(await client.get("/ledger", headers=headers))
    balances = {item["case_number"]: item["pending_balance"] for item in ledger}
    expected = {"CS/184/2026": "45000.00", "CRL/092/2026": "40000.00", "COM/317/2026": "75000.00"}
    if any(balances.get(case_number) != amount for case_number, amount in expected.items()):
        raise RuntimeError(f"Ledger verification failed; expected demo balances {expected}, received {balances}")

    return {
        "clients_created_or_updated": len(CLIENTS),
        "cases_created_or_updated": len(cases),
        "payments_verified": len(payment_samples),
        "pending_balances": expected,
    }


async def main() -> None:
    if os.getenv("APP_ENVIRONMENT", "development").lower() in {"prod", "production"}:
        raise SystemExit("Demo data seeding is disabled in production")
    if os.getenv("ENABLE_DEMO_SEED", "false").lower() != "true":
        raise SystemExit("Set ENABLE_DEMO_SEED=true to explicitly enable demo data seeding")

    admin_phone = os.getenv("DEMO_ADMIN_PHONE", DEMO_ADMIN_PHONE)
    admin_password = os.getenv("DEMO_ADMIN_PASSWORD")
    if not admin_password:
        raise SystemExit("Set DEMO_ADMIN_PASSWORD in .env; never pass the password as a command-line argument")
    api_base_url = os.getenv("DEMO_API_BASE_URL", "http://127.0.0.1:8000/api")
    async with httpx.AsyncClient(base_url=api_base_url.rstrip("/"), timeout=30) as client:
        summary = await seed_demo_data(client, admin_phone=admin_phone, admin_password=admin_password)
    print(f"API demo seed complete: {summary}")


if __name__ == "__main__":
    asyncio.run(main())
