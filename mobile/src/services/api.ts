import * as SecureStore from "expo-secure-store";
import { config, initializeBackend } from "../constants/config";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getToken(): Promise<string | null> {
  await initializeBackend();
  try {
    return await SecureStore.getItemAsync(config.tokenKey);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(config.tokenKey, token);
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(config.tokenKey);
  } catch {
    // already gone
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const t = await getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), path === "/chat" ? 55000 : 15000);
  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, { ...options, headers, signal: controller.signal });
  } catch (error) {
    throw new ApiError(0, error instanceof Error && error.name === "AbortError"
      ? "The backend timed out. Check Backend connection and make sure the server is running."
      : "Cannot reach the backend. Check your Wi-Fi and the address under Backend connection.");
  } finally { clearTimeout(timeout); }
  if (response.status === 401) {
    await clearToken();
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.detail)
        message = Array.isArray(data.detail)
          ? (data.detail[0]?.msg ?? message)
          : data.detail;
    } catch {
      // keep default
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
