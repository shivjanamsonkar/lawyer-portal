from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.seed_demo import DEMO_ADVOCATE_PASSWORD, seed_demo_data
from main import app
from conftest import TEST_PASSWORD


@pytest.mark.asyncio
async def test_api_seed_creates_and_verifies_sample_records(client: tuple[AsyncClient, UUID]) -> None:
    _, _ = client
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test/api") as http:
        await _verify_seed(http)


async def _verify_seed(http: AsyncClient) -> None:
    admin_phone = "+911234567890"

    first_run = await seed_demo_data(http, admin_phone=admin_phone, admin_password=TEST_PASSWORD)
    second_run = await seed_demo_data(http, admin_phone=admin_phone, admin_password=TEST_PASSWORD)

    assert first_run["clients_created_or_updated"] == 3
    assert second_run["cases_created_or_updated"] == 3
    assert second_run["pending_balances"] == {
        "CS/184/2026": "45000.00",
        "CRL/092/2026": "40000.00",
        "COM/317/2026": "75000.00",
    }

    login = await http.post("/auth/login", json={
        "phone": "+919900000002",
        "password": DEMO_ADVOCATE_PASSWORD,
    })
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    clients = (await http.get("/clients", headers=headers)).json()
    cases = (await http.get("/cases", headers=headers)).json()
    ledger = (await http.get("/ledger", headers=headers)).json()
    assert {item["name"] for item in clients} == {"Nisha Kapoor", "Rohan Malhotra", "Aster Textiles Pvt Ltd"}
    assert {item["case_number"] for item in cases} == {"CS/184/2026", "CRL/092/2026", "COM/317/2026"}
    assert len(ledger) == 3


@pytest.mark.asyncio
async def test_api_seed_requires_explicit_opt_in(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core.seed_demo import main

    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.delenv("ENABLE_DEMO_SEED", raising=False)
    with pytest.raises(SystemExit, match="ENABLE_DEMO_SEED=true"):
        await main()


@pytest.mark.asyncio
async def test_api_seed_refuses_production(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core.seed_demo import main

    monkeypatch.setenv("APP_ENVIRONMENT", "production")
    monkeypatch.setenv("ENABLE_DEMO_SEED", "true")
    with pytest.raises(SystemExit, match="disabled in production"):
        await main()
