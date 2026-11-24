import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status = 0) {
    super(message);
    this.name = "ApiError";
  }
}

const TOKEN_STORAGE_KEY = "@treino-system/auth-tokens";
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

let tokens: AuthTokens | null = null;
let persistSession = false;
let refreshInFlight: Promise<boolean> | null = null;

export function getCurrentAuthTokens() {
  return tokens;
}

async function readStoredValue() {
  if (Platform.OS === "web") return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  return SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
}

async function writeStoredValue(value: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(TOKEN_STORAGE_KEY, value);
  return SecureStore.setItemAsync(TOKEN_STORAGE_KEY, value);
}

async function deleteStoredValue() {
  if (Platform.OS === "web") return AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  return SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
}

export async function setAuthTokens(next: AuthTokens, rememberMe: boolean) {
  tokens = next;
  persistSession = rememberMe;
  if (rememberMe) {
    await writeStoredValue(JSON.stringify(next));
  } else {
    await deleteStoredValue();
  }
}

export async function restoreAuthTokens() {
  const raw = await readStoredValue();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthTokens;
    if (!parsed.accessToken || !parsed.refreshToken) {
      await deleteStoredValue();
      return null;
    }
    tokens = parsed;
    persistSession = true;
    return parsed;
  } catch {
    await deleteStoredValue();
    return null;
  }
}

export async function clearAuthTokens() {
  tokens = null;
  persistSession = false;
  await deleteStoredValue().catch(() => undefined);
}

function getApiUrl() {
  if (!API_URL) {
    throw new ApiError("Configure EXPO_PUBLIC_API_URL no arquivo .env do mobile para conectar à API.");
  }
  return API_URL;
}

async function parseError(response: Response) {
  const body = await response.json().catch(() => null) as
    | { detail?: string; message?: string; title?: string }
    | null;
  return new ApiError(
    body?.detail ?? body?.message ?? body?.title ?? "Não foi possível concluir a operação.",
    response.status,
  );
}

async function refreshSession() {
  if (!tokens?.refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/auth/mobile/refresh`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens?.refreshToken }),
        });
        if (!response.ok) return false;
        const result = await response.json() as AuthTokens & { usuario: unknown };
        const { usuario: _usuario, ...nextTokens } = result;
        tokens = nextTokens;
        if (persistSession) await writeStoredValue(JSON.stringify(nextTokens));
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (tokens?.accessToken) headers.set("Authorization", `Bearer ${tokens.accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      ...options,
      method,
      headers,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Não foi possível conectar à API. Verifique o endereço e se o servidor está ativo.");
  }

  const isAuthRoute = endpoint.startsWith("/api/auth/mobile/");
  if (response.status === 401 && !retried && !isAuthRoute && await refreshSession()) {
    return apiRequest<T>(endpoint, options, true);
  }
  if (response.status === 401 && !isAuthRoute) {
    await clearAuthTokens();
  }
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null as T;

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? await response.json() as T : null as T;
}

export const apiGet = <T>(endpoint: string) => apiRequest<T>(endpoint);

export const apiPost = <T>(endpoint: string, body?: unknown) =>
  apiRequest<T>(endpoint, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const apiPut = <T>(endpoint: string, body: unknown) =>
  apiRequest<T>(endpoint, { method: "PUT", body: JSON.stringify(body) });

export const apiPatch = <T>(endpoint: string, body?: unknown) =>
  apiRequest<T>(endpoint, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
