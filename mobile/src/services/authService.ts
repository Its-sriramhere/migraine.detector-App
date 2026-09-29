import type { LoginRequest, RegisterRequest, TokenResponse } from "../types";
import { api, clearToken, storeToken } from "./api";

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/login", body);
  await storeToken(res.access_token);
  return res;
}

export async function register(body: RegisterRequest): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/register", body);
  await storeToken(res.access_token);
  return res;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    await clearToken();
  }
}
