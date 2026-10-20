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
| `raspberry-pi/` | Legacy edge data-acquisition app (kept for reference)          |
| `docs/`         | Architecture, API reference and the wearable GATT protocol     |
| `_archive_web/` | Archived website files (temporary, deleted after MVP works)    |

## The app

React Native (Expo SDK 57) with TypeScript and **React Navigation**
(Native Stack + Bottom Tabs). The UI follows the Figma design
*"Migraine Detector — Mobile App UI (10 Screens)"*: white surfaces, navy
type, green/amber/red risk bands, 18–21 px card radii, 5-tab bottom nav
(Home · Monitoring · History · Symptoms · Profile).

Screens: Splash · Onboarding · Home Dashboard · Risk Prediction ·
Health Metrics · Trends & Analytics · Insights & Alerts ·
Recommendations · Wearable Device · Profile & Settings, plus the 5-step
health assessment.

### Wearable (Bluetooth) instead of a Raspberry Pi

The app talks to a BLE wearable over a custom GATT profile
(`docs/wearable-protocol.md`): it subscribes to a `vitals` stream, posts
readings to the backend as `source="ble"`, and writes a risk `alert` back to
the watch so it can vibrate.

- `mobile/src/services/ble/watchProtocol.ts` — UUIDs + packet codec
- `mobile/src/services/ble/bleClient.ts` — lazy `react-native-ble-plx` loader
- `mobile/src/services/watchService.ts` — scan / connect / subscribe / alert
- `mobile/src/services/ble/simulatedWatch.ts` — simulated wearable for testing

BLE needs a **development build** (`npx expo run:android` or an EAS dev
profile) because Expo Go has no BLE native module. The app degrades
gracefully: the simulated wearable keeps the whole flow testable in Expo Go.


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
