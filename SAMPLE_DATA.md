# Local Demo Access

These credentials are for local demonstration only. The seed creates synthetic records in `lms_db`; do not use them in a deployed or internet-accessible environment.

## Demo logins

| Role | Mobile login | Password | What to view |
| --- | --- | --- | --- |
| Super admin | `+919900000001` | `AdminDemo@2026!` | `/admin/dashboard` for user approval and password reset |
| Advocate | `+919900000002` | `AdvocateDemo@2026!` | Cases, clients, hearing alarms, and fee ledger |

Passwords are stored as Argon2 hashes. The admin is created by the one-time bootstrap command. The advocate account, its approval, and all client/case/payment sample records are created through the authenticated API seed script.

## Included sample records

- Three clients: Nisha Kapoor, Rohan Malhotra, and Aster Textiles Pvt Ltd.
- Three cases with CNRs, courts, rooms, judges, stages, preparation notes, and hearings set 2, 4, and 7 days after the seed run.
- Four payments across UPI, bank transfer, cash, and cheque.
- Pending balances: CS/184/2026 is INR 45,000; CRL/092/2026 is INR 40,000; COM/317/2026 is INR 75,000.
- Hearing alarms are derived from those case hearing dates and appear in the next-seven-days list.

The CNRs and court details are synthetic. eCourts sync is not run by the seed; verify scraper selectors and permitted access before enabling it. The alarm page currently displays hearing reminders locally; scheduled SMS/WhatsApp delivery is not configured.

## Seed the existing database through the API

Configure the real `lms_db` password and a unique JWT secret in the ignored `.env`, then start Docker Desktop. Since the Next dev server already uses port 3000, start the backend services only:

```powershell
docker compose up -d --build redis migrate api worker
```

Create the first administrator once:

```powershell
docker compose exec api python -m app.core.bootstrap_admin
```

Then create/approve the demo advocate and add clients, cases, and payments using API calls:

```powershell
docker compose exec -e ENABLE_DEMO_SEED=true api python -m app.core.seed_demo
```

The seed uses the API's signup, admin approval, client, case, payment, and ledger endpoints. It is safe to rerun, requires explicit opt-in, and refuses to run when `APP_ENVIRONMENT=production`. The admin bootstrap is a separate one-time prerequisite and writes only the initial super-admin account.

Open http://localhost:3000/login and use a demo mobile number and password above. Sign out before switching accounts.
