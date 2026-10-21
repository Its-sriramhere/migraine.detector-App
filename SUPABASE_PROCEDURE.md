# Supabase + Deployment Reference

## Current state (verified)

The backend runs against Supabase Postgres and all data from the local
SQLite database has been migrated.

| Item | Value |
|---|---|
| Supabase project | `uufvwpbacqmtjstxkavn` (region `ap-northeast-1`) |
| API URL | `https://uufvwpbacqmtjstxkavn.supabase.co` |
| Publishable key | `sb_publishable_TZs_6AeL_FRDCiF_8WWv1g_kdwmXpLQ` |
| Database host (IPv6 only) | `db.uufvwpbacqmtjstxkavn.supabase.co` |
| Connection host used by the app | `aws-0-ap-northeast-1.pooler.supabase.com` (IPv4, session mode) |
| Tables created | 14 |
| Rows migrated | 549 |

### Why the pooler host

`db.<ref>.supabase.co` publishes only an AAAA (IPv6) record, so hosts
without IPv6 cannot resolve it. The Supabase **pooler** publishes IPv4
addresses and is the recommended entry point for mobile clients and
cloud hosts.

Pooler credentials differ from the direct connection:

- user: `postgres.<project-ref>`
- port: `5432` (session mode) or `6543` (transaction mode)
- database: `postgres`

## Environment configuration

`backend/.env` (never committed):

```env
DATABASE_URL=postgresql://postgres.<ref>:<url-encoded-password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://uufvwpbacqmtjstxkavn.supabase.co
SUPABASE_PROJECT_REF=uufvwpbacqmtjstxkavn
SUPABASE_SERVICE_ROLE_KEY=      # optional, only for Supabase Storage mirroring
SUPABASE_STORAGE_BUCKET=datasets
SMS_ENABLED=false
SMS_PROVIDER=mock
```

The password must be URL-encoded in `DATABASE_URL` (`@` becomes `%40`).

`backend/.env` is gitignored. Never commit the database password.

## Re-running the migration

```powershell
cd backend
python scripts/migrate_to_supabase.py
```

The script creates the schema from the backend's own SQLAlchemy models,
seeds the assessment question bank, copies every row from
`backend/migraine.db` preserving primary keys, and re-syncs the Postgres
sequences. It is destructive for the target schema (it drops and recreates
the tables) but never touches the local SQLite file.

Verify afterwards:

```powershell
cd backend
python scripts/verify_supabase.py
```

## Developer account

The reserved account is provisioned with a random one-time password. To set
a known password:

```powershell
cd backend
$env:DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
.venv\Scripts\python.exe -m app.reset_developer_password testtest
```

## Deploying to Render.com (public HTTPS backend)

`render.yaml` in the repository root is a Render Blueprint, so the service
can be created straight from the repo.

### Option A - Blueprint (recommended)

1. Push the repository to GitHub.
2. In Render: **New > Blueprint**, select the repository.
3. Render creates the `migraine-detector-api` web service and a free
   Postgres database, wiring `DATABASE_URL` automatically.
4. Set the remaining environment variables marked `sync: false`:
   - `SUPABASE_URL` = `https://uufvwpbacqmtjstxkavn.supabase.co`
   - `SUPABASE_PROJECT_REF` = `uufvwpbacqmtjstxkavn`
   - `CORS_ORIGINS` = `https://migraine-detector-api.onrender.com`
   - `OPENAI_API_KEY` (optional, enables AI replies for Mira)
5. Deploy. The API is live at `https://migraine-detector-api.onrender.com`.

### Option B - Manual web service

1. Render: **New > Web Service**, connect the repository.
2. Settings:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/api/chat/status`
3. Environment variables:

```
DATABASE_URL=postgresql://postgres.<ref>:<url-encoded-password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://uufvwpbacqmtjstxkavn.supabase.co
SUPABASE_PROJECT_REF=uufvwpbacqmtjstxkavn
CORS_ORIGINS=https://migraine-detector-api.onrender.com
SECRET_KEY=<generate>
SMS_ENABLED=false
SMS_PROVIDER=mock
```

### Notes

- The free plan sleeps after inactivity. The first request after a sleep
  takes roughly 30 seconds while the instance wakes.
- Render injects `PORT`; the start command must use `$PORT`, not `8000`.
- `SECRET_KEY` must be a long random string. The default in
  `config.py` is a development placeholder.
- CORS is irrelevant for the native Android client, but the web frontend
  and any browser-based test harness need the API origin listed.

## Pointing the Android app at the public backend

The app reads `EXPO_PUBLIC_API_URL` at build time and falls back to the
in-app **Backend connection** screen, where the address can be changed at
runtime. The screen validates the address by calling `/api/chat/status`
and refuses anything that is not a Migraine Detector backend.

Baking the public URL into a build:

```powershell
cd mobile
$env:EXPO_PUBLIC_API_URL="https://migraine-detector-api.onrender.com/api"
npx expo run:android --variant release
```

## Verifying a deployment

```powershell
# status
curl https://migraine-detector-api.onrender.com/api/chat/status

# guide
curl https://migraine-detector-api.onrender.com/api/chat/guide

# authenticated read
curl -X POST https://migraine-detector-api.onrender.com/api/auth/login `
     -H "Content-Type: application/json" `
     -d '{"email":"developer@migraine.example.com","password":"testtest"}'
```
