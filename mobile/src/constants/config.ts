import AsyncStorage from "@react-native-async-storage/async-storage";

// The public backend. Override at build time with EXPO_PUBLIC_API_URL, or at
// runtime from the in-app "Backend connection" screen.
const raw = process.env.EXPO_PUBLIC_API_URL ?? "https://migraine-detector-api.onrender.com/api";
const BACKEND_KEY = "mg_backend_url_v1";
let backend = raw.replace(/\/$/, "");
let initialized: Promise<void> | null = null;

export function normalizeBackendUrl(value: string): string {
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Enter an HTTP or HTTPS backend address without credentials or query parameters.");
  }
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path.endsWith("/api") ? path : `${path}/api`}`;
}

export function initializeBackend(): Promise<void> {
  if (!initialized) initialized = AsyncStorage.getItem(BACKEND_KEY).then((value) => {
    if (value) backend = normalizeBackendUrl(value);
  }).catch(() => undefined);
  return initialized;
}

export async function saveBackendUrl(value: string): Promise<void> {
  const normalized = normalizeBackendUrl(value);
  await initializeBackend();
  await AsyncStorage.setItem(BACKEND_KEY, normalized);
  backend = normalized;
}

export const config = {
  get apiBaseUrl() { return backend; },
  get wsBaseUrl() { return backend
    .replace(/\/api$/, "")
    .replace(/^http/, "ws"); },
  tokenKey: "mg_token",
  refreshIntervalMs: 15000,
} as const;
