# Migraine Detector — Android Beta

## What you need

- An Android phone, Android 6.0 (API 23) or newer. Android 12+ is recommended.
- The APK file: `app-release.apk`
- A network connection. **Cellular data works** — the app is already pointed at
  the public backend.

## Install

**Option 1 — from this computer, over USB**

```bash
adb install -r app-release.apk
```

**Option 2 — on the phone itself**

1. Copy `app-release.apk` to the phone (cable, Drive, WhatsApp, email).
2. Open it in the Files app and tap it.
3. Android will warn that the file came from outside the Play Store. Choose
   **Settings → Allow from this source**, then go back and tap **Install**.

> The build is signed with a release key, so it installs over any previous
> copy of the app without uninstalling first.

## Sign in

| | |
|---|---|
| **Email** | `developer@migraine.example.com` |
| **Password** | `testtest` |

On first launch you will go through a short onboarding, then a 5-step health
assessment. **Answer every question** — the submit button stays disabled until
the current step is complete.

## First launch can take ~30 seconds

The backend runs on a free hosting plan that sleeps when idle. The first
request after a quiet period takes a little longer to answer. After that the
app is fast. If a screen appears empty, pull down to refresh or wait and
retry.

## Connecting a wearable

The app scans for Bluetooth Low Energy wearables.

| Android version | What you will be asked for |
|---|---|
| Android 12+ (API 31+) | **Nearby devices** permission |
| Android 11 and older | **Location** permission (required by Android for BLE scanning) |
| All versions | **Bluetooth must be switched on** in system settings |

Grant the permission when prompted, then open **Monitoring** and tap the
connect button. If scanning finds nothing, make sure the wearable is
powered on, not already paired to another phone, and within a few metres.

## Checking the backend address

The app is pre-configured with the public backend. If you need to change it
(for example to test against a laptop on the same Wi-Fi), open
**Backend connection** from the sign-in screen:

- **Public backend**: `https://migraine-detector-api.onrender.com/api`
- **Local backend**: `http://<your-computer-ip>:8000/api`

Tap **Test connection** to check the address before saving. You will need to
sign in again after switching servers.

## What to test

| Area | Notes |
|---|---|
| **Onboarding** | Three slides, then the assessment. |
| **Health assessment** | 14 questions in 5 steps. Builds a personal risk profile. |
| **Home** | Risk gauge, today's health, prediction card, trend chart. |
| **Mira** | The floating blue button. Ask about any screen, or a wellness topic. |
| **Monitoring** | Wearable connection and live readings. |
| **Symptoms** | Log a migraine episode with severity, symptoms and triggers. |
| **History** | Previous predictions, episodes and alerts. |
| **Profile & Settings** | Account, data export, developer tools. |
| **Alerts** | Notifications raised by the prediction engine. |

## Known limitations

- **No real wearable included.** Without a paired device, use the simulated
  wearable in **Monitoring** to exercise the UI. It produces realistic
  readings without Bluetooth.
- **Risk scores are illustrative.** This is a research prototype using a
  heuristic model, not a clinically validated diagnostic device. The app says
  so on every screen that shows a score.
- **Mira is in offline guide mode.** It answers from the built-in app guide
  and wellness FAQ. There is no language model connected in this build.
- **No SMS.** Alerts are recorded in the app and on the server, but nothing
  is sent to a phone number.
- **The backend sleeps when idle** on the free hosting plan, so the first
  request after a pause can take up to 30 seconds.

## Reporting problems

Please include:

1. Your phone model and Android version.
2. The steps that led to the problem.
3. A screenshot, if the issue is visual.
4. Whether the problem also happens on Wi-Fi, or only on cellular.
