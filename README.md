# Migraine Detector — Mobile App + Backend (App-only repo)

> Research prototype. This system estimates migraine risk and provides
> explanations; it is **not** a medically validated diagnostic device.
> The website lives in a separate folder and is never touched from here.

## Repository layout (app only)

| Folder          | Purpose                                                        |
|-----------------|----------------------------------------------------------------|
| `mobile/`       | Expo + TypeScript + React Navigation mobile app (Android + iOS)|
| `backend/`      | FastAPI API, SQLAlchemy models, WebSocket, ML runtime          |
| `ml/`           | Training/evaluation scripts (scikit-learn, XGBoost, SHAP)      |
| `raspberry-pi/` | Edge data-acquisition Python application                       |
| `docs/`         | Architecture and API documentation                             |
| `_archive_web/` | Archived website files (temporary, deleted after MVP works)    |

## Quick start

### Backend (localhost for now)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # optional: SMS + override settings
uvicorn app.main:app --reload --port 8000
```

Docs: http://localhost:8000/docs

Default DB is local SQLite (`migraine.db`, gitignored). Set `DATABASE_URL`
to `postgresql+psycopg://...` to use PostgreSQL.

### Mobile

```bash
cd mobile
npm install
copy .env.example .env   # set EXPO_PUBLIC_API_URL (see below)
npx expo start
```

- iOS simulator: `http://localhost:8000/api` works.
- Android emulator: `http://10.0.2.2:8000/api`.
- Physical device: `http://<your-LAN-IP>:8000/api` (never `localhost`).
- Add the same LAN origin to backend `CORS_ORIGINS`.

Auth uses JWT Bearer stored in SecureStore (`mg_token`). WS:
`ws://<same-host>/ws/{userId}?token=<jwt>` with 15s poll fallback.

## Demo mode

Register an account, then use the Demo toggle (Live / Demo) to push
NORMAL / MODERATE / HIGH-RISK presets through the same prediction
pipeline as the Raspberry Pi. Demo values are always badged `DEMO MODE`.

## Datasets & threshold calibration

`ml/datasets/` drives deviation cutoffs and baselines:

- `ml/build_calibration_dataset.py` → `calibration.csv`
- `ml/calibrate.py` → `backend/app/ml/thresholds.json` (bands low<30,
  moderate≤70, high>70; hot-reloads engine)

```
GET  /api/datasets
POST /api/datasets/build
POST /api/datasets/calibrate
GET  /api/datasets/thresholds
```

## Raspberry Pi

`raspberry-pi/main.py` posts to `POST /api/sensor/readings` every 10s
plus `POST /api/devices/heartbeat` every 60s. The mobile app never talks
I2C directly — always `Sensors → Pi → Backend → App`.
