# AdvocatePro Chambers

Monorepo scaffold for a legal practice portal. The existing Create React App project in the parent directory is kept separate.

## Windows development paths

The project keeps its source and Node dependencies on D:. The API virtual environment is configured at `D:\Users\Shiv\Environments\advocatepro-api`; VS Code workspace settings route terminal temp files, npm/pip caches, Python bytecode, and Playwright browser downloads into `D:\Users\Shiv` as well. Select that interpreter if VS Code does not pick it up automatically. The base Python and Node installations remain in their installed locations; moving Windows' active `USERPROFILE` or `APPDATA` is not required for this project.

To recreate the Python environment, run from the repository root in PowerShell:

```powershell
c:/python314/python.exe -m venv D:/Users/Shiv/Environments/advocatepro-api
D:/Users/Shiv/Environments/advocatepro-api/Scripts/python.exe -m pip install -r advocate-pro/apps/api/requirements.txt
```

## Start the local stack

1. Copy `.env.example` to `.env`. Set the actual PostgreSQL password in both `DATABASE_URL` and `DATABASE_URL_DOCKER`; URL-encode special characters. Generate a unique `JWT_SECRET_KEY` of at least 32 characters.
2. Ensure the PostgreSQL server listening on port 5432 contains the `lms_db` database and accepts connections from Docker Desktop through `host.docker.internal`.
3. Run `docker compose up --build` from this directory. Compose applies Alembic migrations to the existing `lms_db`; it does not create a second PostgreSQL container.
4. Open the web app at http://localhost:3000. The API liveness endpoint is http://localhost:8000/health and database readiness is http://localhost:8000/ready.

To create the first administrator, set `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PHONE`, `BOOTSTRAP_ADMIN_EMAIL`, and a strong `BOOTSTRAP_ADMIN_PASSWORD` in `.env`, then run `docker compose run --rm api python -m app.core.bootstrap_admin`. The command refuses to create a second super-admin.

For local demo credentials and sample clients, cases, upcoming hearings, and ledger entries, see [SAMPLE_DATA.md](SAMPLE_DATA.md). Demo seeding is opt-in and disabled in production.

Advocate accounts start in `PENDING_APPROVAL`; only a super-admin can approve them. Passwords are Argon2 hashes, reset credentials are randomly generated and shown once, and users must change a reset password before entering the portal. Protected client, case, payment, and eCourts operations are scoped to the authenticated advocate. Postgres and Redis publish only on localhost for development. Before public production deployment, configure TLS/reverse-proxy headers, backups, monitoring, rate limiting, and verified eCourts selectors/terms. Scheduled T-7 / T-1 / T-0 notification delivery is not configured yet.

## Production blockers

Do not expose the current Next.js 14.2.35 build to the public internet. The dependency advisory scan reports 23 Next.js findings, including critical unauthenticated RCE advisories CVE-2026-75604 and GHSA-2xp9-vwfh-vxw4. Published fixes start at Next.js 15.5.24 or 16.3.3; there is no patched Next.js 14 release in the scan. Upgrading requires changing the specified Next.js 14 target and should be approved before deployment. The local database migration also remains pending until the real `lms_db` credentials are configured in `.env`.

Run backend tests with `python -m pytest apps/api/tests -q` from the project root, and frontend tests with `npm --prefix apps/web test`.