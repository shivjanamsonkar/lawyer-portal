# AdvocatePro Chambers

Monorepo scaffold for a legal practice portal. The existing Create React App project in the parent directory is kept separate.

## Windows development paths

The project keeps its source and Node dependencies on D:. The API virtual environment is configured at `D:\Users\Shiv\Environments\advocatepro-api`; VS Code workspace settings route terminal temp files, npm/pip caches, Python bytecode, and Playwright browser downloads into `D:\Users\Shiv` as well. Select that interpreter if VS Code does not pick it up automatically. The base Python and Node installations remain in their installed locations; moving Windows' active `USERPROFILE` or `APPDATA` is not required for this project.

To recreate the Python environment, run from the repository root in PowerShell:

```powershell
c:/python314/python.exe -m venv D:/Users/Shiv/Environments/advocatepro-api
D:/Users/Shiv/Environments/advocatepro-api/Scripts/python.exe -m pip install -r advocate-pro/apps/api/requirements.txt
```

## Run locally on Windows

The native Windows setup uses the installed PostgreSQL service and does not require Docker. The local `.env` and `apps/web/.env.local` files are ignored by Git and should point to `127.0.0.1`; never put local credentials in tracked files. PostgreSQL should be running on port 5432 with the `lms_db` database. The API's current database revision is applied with Alembic before startup.

Start the API in one PowerShell terminal:

```powershell
Set-Location D:\Lawer\lawyer-portal\advocate-pro\apps\api
D:\Users\Shiv\Environments\advocatepro-api\Scripts\python.exe -m alembic upgrade head
D:\Users\Shiv\Environments\advocatepro-api\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Start the web app in a second terminal:

```powershell
Set-Location D:\Lawer\lawyer-portal\advocate-pro\apps\web
npm run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000. API health is available at http://localhost:8000/health and database readiness at http://localhost:8000/ready. Local demo accounts and sample data are documented in [SAMPLE_DATA.md](SAMPLE_DATA.md). Demo seeding is opt-in and disabled by default.

The core portal (authentication, matters, clients, hearing dates, and fee ledger) runs with PostgreSQL alone. The eCourts background sync additionally needs a local Redis server and Celery worker; those are not available in this Windows setup unless Docker or separate Redis/worker services are installed and started.

For a Docker-based setup on a machine with Docker Desktop running, copy `.env.example` to `.env`, set both database URLs and a unique JWT secret, then run `docker compose up --build` from this directory. Compose uses the existing PostgreSQL database; it does not create a PostgreSQL container.

To create an administrator for a fresh database, configure `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PHONE`, `BOOTSTRAP_ADMIN_EMAIL`, and a strong `BOOTSTRAP_ADMIN_PASSWORD` in `.env`, then run `python -m app.core.bootstrap_admin` from `apps/api`. The command refuses to create a second super-admin.

Advocate accounts start in `PENDING_APPROVAL`; only a super-admin can approve them. Passwords are Argon2 hashes, reset credentials are randomly generated and shown once, and users must change a reset password before entering the portal. Protected client, case, payment, and eCourts operations are scoped to the authenticated advocate. Postgres and Redis publish only on localhost for development. Before public production deployment, configure TLS/reverse-proxy headers, backups, monitoring, rate limiting, and verified eCourts selectors/terms. Scheduled T-7 / T-1 / T-0 notification delivery is not configured yet.

## Production blockers

Do not expose the current Next.js 14.2.35 build to the public internet. The dependency advisory scan reports 23 Next.js findings, including critical unauthenticated RCE advisories CVE-2026-75604 and GHSA-2xp9-vwfh-vxw4. Published fixes start at Next.js 15.5.24 or 16.3.3; there is no patched Next.js 14 release in the scan. Upgrading requires changing the specified Next.js 14 target and should be approved before deployment. The local database migration also remains pending until the real `lms_db` credentials are configured in `.env`.

Run backend tests with `python -m pytest apps/api/tests -q` from the project root, and frontend tests with `npm --prefix apps/web test`.
