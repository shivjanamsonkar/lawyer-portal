from uuid import UUID

from httpx import AsyncClient


async def test_admin_approval_reset_and_disable_workflow(client: tuple[AsyncClient, UUID]) -> None:
    http, admin_id = client
    signup = await http.post("/api/auth/signup", json={
        "full_name": "Nisha Kapoor",
        "phone": "+919876543212",
        "email": "admin-flow@example.test",
        "chamber_address": "New Delhi",
        "password": "AdvocateSecure123!",
    })
    assert signup.status_code == 201

    users = await http.get("/api/admin/users")
    assert users.status_code == 200
    admin_token = http.headers["Authorization"]
    del http.headers["Authorization"]
    assert (await http.get("/api/admin/users")).status_code == 401
    http.headers["Authorization"] = admin_token
    pending_user = next(user for user in users.json() if user["phone"] == "+919876543212")
    user_id = pending_user["id"]
    assert "password_hash" not in pending_user

    rejected = await http.put(f"/api/admin/users/{user_id}/status", json={"status": "REJECTED"})
    assert rejected.status_code == 200
    rejected_login = await http.post("/api/auth/login", json={"phone": "+919876543212", "password": "AdvocateSecure123!"})
    assert rejected_login.status_code == 403

    approved = await http.put(f"/api/admin/users/{user_id}/status", json={"status": "APPROVED"})
    assert approved.status_code == 200
    assert approved.json()["status"] == "APPROVED"

    user_login = await http.post("/api/auth/login", json={"phone": "+919876543212", "password": "AdvocateSecure123!"})
    assert user_login.status_code == 200
    http.headers["Authorization"] = f"Bearer {user_login.json()['access_token']}"
    assert (await http.get("/api/admin/users")).status_code == 403
    http.headers["Authorization"] = admin_token

    reset = await http.post(f"/api/admin/users/{user_id}/reset-password")
    assert reset.status_code == 200
    temporary_password = reset.json()["temporary_password"]
    assert reset.json()["must_change_password"] is True

    reset_login = await http.post("/api/auth/login", json={"phone": "+919876543212", "password": temporary_password})
    assert reset_login.status_code == 200
    assert reset_login.json()["must_change_password"] is True
    http.headers["Authorization"] = f"Bearer {reset_login.json()['access_token']}"
    assert (await http.get("/api/cases")).status_code == 403
    changed = await http.post("/api/auth/change-password", json={
        "current_password": temporary_password,
        "new_password": "ChangedSecure123!",
    })
    assert changed.status_code == 200
    assert "access_token" in changed.json()
    assert (await http.get("/api/cases")).status_code == 403
    http.headers["Authorization"] = f"Bearer {changed.json()['access_token']}"
    assert (await http.get("/api/cases")).status_code == 200

    http.headers["Authorization"] = admin_token
    disabled = await http.put(f"/api/admin/users/{user_id}/status", json={"status": "DISABLED"})
    assert disabled.status_code == 200
    blocked = await http.post("/api/auth/login", json={"phone": "+919876543212", "password": "ChangedSecure123!"})
    assert blocked.status_code == 403
