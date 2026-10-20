# Migraine Sense — Wearable GATT Protocol

BLE profile implemented by the watch firmware and consumed by the mobile app
(`mobile/src/services/ble/watchProtocol.ts` is the reference implementation).

All multi-byte values are **little-endian**.

## Service

| Name | UUID |
|---|---|
| `MigraineSense` (primary service) | `7a110001-1e1f-4a9b-9c3d-0f1e2d3c4b5a` |

The watch also advertises the standard **Heart Rate Service** (`0x180d` /
characteristic `0x2a37`) so third-party apps can read heart rate.

## Characteristics

| Name | UUID | Properties | Purpose |
|---|---|---|---|
| `vitals` | `7a110002-…` | notify | streamed vitals packet |
| `alert` | `7a110003-…` | write | risk alert → haptic/buzzer |
| `control` | `7a110004-…` | write | start/stop streaming, sample rate |
| `info` | `7a110005-…` | read | firmware, battery, capabilities |

## `vitals` packet (notify, 14–16 bytes)

| Offset | Type | Field | Unit / notes |
|---|---|---|---|
| 0 | `u8` | `version` | protocol version (currently `1`) |
| 1 | `u8` | `heart_rate` | BPM |
| 2 | `u16` | `hrv` | ms (RMSSD) |
| 4 | `u8` | `spo2` | % |
| 5 | `i16` | `temperature` | centi-degrees C (e.g. `3660` = 36.60 °C) |
| 7 | `u8` | `systolic_bp` | mmHg (`0` = not measured) |
| 8 | `u8` | `diastolic_bp` | mmHg (`0` = not measured) |
| 9 | `u16` | `sleep_minutes` | last night total |
| 11 | `u16` | `activity` | milli-g (0.21 g → `210`) |
| 13 | `u8` | `signal_quality` | 0–100 % |
| 14 | `u8` | `flags` | reserved, send `0` |
| 15 | `u8` | `flags2` | reserved, send `0` |

The app decodes with `decodeVitals()` and posts the result to the backend as
`POST /api/sensor/readings` with `source="ble"`.

## `alert` packet (write, 3 bytes)

| Offset | Type | Field | Notes |
|---|---|---|---|
| 0 | `u8` | `level` | `0` none · `1` info · `2` moderate · `3` high |
| 1 | `u16` | `duration_ms` | vibration length, max 65535 |

The app writes this when the backend raises an alert (`alert_update` over the
WebSocket). The watch should vibrate for `duration_ms`.

## `control` packet (write, 3 bytes)

| Offset | Type | Field |
|---|---|---|
| 0 | `u8` | `cmd` — `1` start stream · `2` stop stream · `3` set rate |
| 1 | `u16` | `arg` — sampling rate in Hz for `cmd = 3` |

## `info` packet (read)

| Offset | Type | Field |
|---|---|---|
| 0 | `u8` | `fw_len` |
| 1..n | utf8 | firmware version string |
| n+1 | `u8` | battery % |
| n+2 | `u8` | capability flags |

## Suggested streaming behaviour

- Default sample rate: 1 Hz while connected, 0.1 Hz in low-power mode.
- Notify `vitals` only when a value changed materially (HR ±1, HRV ±2, etc.).
- Keep the connection interval at ~30–50 ms for responsive haptics.
- The app reconnects automatically with exponential backoff; the watch should
  accept reconnects without a full re-pair (bonded or not).

## Testing without hardware

`mobile/src/services/ble/simulatedWatch.ts` implements the same interface and
emits realistic vitals every 2 s. Use it in Expo Go (which has no BLE native
module) via the **Use simulated wearable** toggle on the Wearable screen.
Real BLE requires a development build: `npx expo run:android` or an EAS
development profile.
