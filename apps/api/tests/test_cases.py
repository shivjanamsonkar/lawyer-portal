from uuid import UUID, uuid4

from httpx import AsyncClient


async def test_case_filtering_and_request_cannot_change_ownership(client: tuple[AsyncClient, UUID]) -> None:
    http, advocate_id = client
    created_client = await http.post("/api/clients", json={
        "advocate_id": str(advocate_id),
        "name": "Filter Client",
        "phone": "+919876543213",
    })
    assert created_client.status_code == 201

    response = await http.post("/api/cases", json={
        "advocate_id": str(uuid4()),
        "client_id": created_client.json()["id"],
        "cnr_number": "ABCDEF0123456789",
        "case_number": "CS/221/2026",
        "court_name": "Delhi High Court",
        "petitioner": "Filter Client",
        "respondent": "Other Party",
        "next_hearing_date": "2026-11-10",
    })
    assert response.status_code == 201
    assert response.json()["advocate_id"] == str(advocate_id)
    assert len((await http.get("/api/cases", params={"cnr_number": "ABCDEF0123456789"})).json()) == 1
    assert len((await http.get("/api/cases", params={"client_name": "Filter Client"})).json()) == 1
    assert (await http.get("/api/cases", params={"cnr_number": "NOT-A-MATCH"})).json() == []
