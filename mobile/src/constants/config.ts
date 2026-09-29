const raw =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.7:8000/api";

export const config = {
  apiBaseUrl: raw.replace(/\/$/, ""),
  wsBaseUrl: raw
    .replace(/\/api$/, "")
    .replace(/^http/, "ws"),
  tokenKey: "mg_token",
  refreshIntervalMs: 15000,
} as const;
