/**
 * GATT profile for the Migraine Sense wearable.
 *
 * The watch firmware is ours, so the protocol is defined here and mirrored
 * by the firmware. Everything is little-endian.
 *
 *   Service   7A110001-1E1F-4A9B-9C3D-0F1E2D3C4B5A
 *   vitals    7A110002-…  notify   packed vitals packet
 *   alert     7A110003-…  write    risk alert to the watch (haptic)
 *   control   7A110004-…  write    start/stop streaming, sample rate
 *   info      7A110005-…  read     firmware, battery, capabilities
 *
 * The watch also advertises the standard Heart Rate Service (0x180D) so
 * third-party apps can read the heart rate.
 *
 * No Buffer dependency: the codec works on Uint8Array and converts to the
 * base64 strings react-native-ble-plx expects.
 */

export const WATCH_SERVICE_UUID = "7a110001-1e1f-4a9b-9c3d-0f1e2d3c4b5a";
export const VITALS_CHAR_UUID = "7a110002-1e1f-4a9b-9c3d-0f1e2d3c4b5a";
export const ALERT_CHAR_UUID = "7a110003-1e1f-4a9b-9c3d-0f1e2d3c4b5a";
export const CONTROL_CHAR_UUID = "7a110004-1e1f-4a9b-9c3d-0f1e2d3c4b5a";
export const INFO_CHAR_UUID = "7a110005-1e1f-4a9b-9c3d-0f1e2d3c4b5a";

export const HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
export const HEART_RATE_CHAR_UUID = "00002a37-0000-1000-8000-00805f9b34fb";

export const PROTOCOL_VERSION = 1;

export type AlertLevel = 0 | 1 | 2 | 3; // none | info | moderate | high

export interface Vitals {
  version: number;
  heart_rate: number;
  hrv: number;
  spo2: number;
  temperature: number; // degrees C
  systolic_bp: number;
  diastolic_bp: number;
  sleep_minutes: number;
  activity: number;
  signal_quality: number;
}

export interface WatchInfo {
  firmware: string;
  battery: number;
  capabilities: number;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? "=" : B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? "=" : B64[b2 & 63];
  }
  return out;
}

export function base64ToBytes(value: string): Uint8Array {
  const clean = value.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const bytes = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const n =
      (B64.indexOf(clean[i]) << 18) |
      (B64.indexOf(clean[i + 1]) << 12) |
      ((clean[i + 2] ? B64.indexOf(clean[i + 2]) : 0) << 6) |
      (clean[i + 3] ? B64.indexOf(clean[i + 3]) : 0);
    if (p < bytes.length) bytes[p++] = (n >> 16) & 255;
    if (p < bytes.length) bytes[p++] = (n >> 8) & 255;
    if (p < bytes.length) bytes[p++] = n & 255;
  }
  return bytes;
}

function u16le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

/** Packed vitals packet, little-endian. */
export function encodeVitals(v: Vitals): Uint8Array {
  const b = new Uint8Array(16);
  b[0] = v.version & 0xff;
  b[1] = Math.round(v.heart_rate) & 0xff;
  b[2] = Math.round(v.hrv) & 0xff;
  b[3] = (Math.round(v.hrv) >> 8) & 0xff;
  b[4] = Math.round(v.spo2) & 0xff;
  const temp = Math.round(v.temperature * 100);
  b[5] = temp & 0xff;
  b[6] = (temp >> 8) & 0xff;
  b[7] = Math.round(v.systolic_bp) & 0xff;
  b[8] = Math.round(v.diastolic_bp) & 0xff;
  b[9] = Math.round(v.sleep_minutes) & 0xff;
  b[10] = (Math.round(v.sleep_minutes) >> 8) & 0xff;
  const act = Math.round(v.activity * 1000);
  b[11] = act & 0xff;
  b[12] = (act >> 8) & 0xff;
  b[13] = Math.round(v.signal_quality * 100) & 0xff;
  return b;
}

export function decodeVitals(data: Uint8Array | string): Vitals | null {
  try {
    const b = typeof data === "string" ? base64ToBytes(data) : data;
    if (b.length < 14) return null;
    const temp = (b[5] | (b[6] << 8)) << 16 >> 16;
    return {
      version: b[0],
      heart_rate: b[1],
      hrv: u16le(b, 2),
      spo2: b[4],
      temperature: temp / 100,
      systolic_bp: b[7],
      diastolic_bp: b[8],
      sleep_minutes: u16le(b, 9),
      activity: u16le(b, 11) / 1000,
      signal_quality: b[13] / 100,
    };
  } catch {
    return null;
  }
}

/** Risk alert written to the watch so it can vibrate. */
export function encodeAlert(level: AlertLevel, durationMs = 8000): Uint8Array {
  const b = new Uint8Array(3);
  const d = Math.min(65535, Math.round(durationMs));
  b[0] = level & 0xff;
  b[1] = d & 0xff;
  b[2] = (d >> 8) & 0xff;
  return b;
}

export const CONTROL = {
  START_STREAM: 1,
  STOP_STREAM: 2,
  SET_RATE: 3,
} as const;

export function encodeControl(cmd: number, arg = 0): Uint8Array {
  const b = new Uint8Array(3);
  b[0] = cmd & 0xff;
  b[1] = arg & 0xff;
  b[2] = (arg >> 8) & 0xff;
  return b;
}

export function decodeInfo(data: Uint8Array | string): WatchInfo | null {
  try {
    const b = typeof data === "string" ? base64ToBytes(data) : data;
    if (b.length < 3) return null;
    const fwLen = b[0];
    let firmware = "";
    for (let i = 1; i <= fwLen && i < b.length; i += 1) {
      firmware += String.fromCharCode(b[i]);
    }
    return {
      firmware,
      battery: b[1 + fwLen],
      capabilities: b[2 + fwLen],
    };
  } catch {
    return null;
  }
}
