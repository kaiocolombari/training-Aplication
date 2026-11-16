export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

const API_URL = (import.meta.env.VITE_API_URL || "https://localhost:7285").replace(/\/$/, "");
let csrfToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export const AUTH_SESSION_EXPIRED_EVENT = "app:auth-session-expired";
export const API_FORBIDDEN_EVENT = "app:api-forbidden";

function notifySessionExpired() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }
}

function notifyForbidden(endpoint: string) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(API_FORBIDDEN_EVENT, { detail: { endpoint } }));
    }
}

function isUnsafe(method: string) {
    return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

async function loadCsrfToken(force = false): Promise<string> {
    if (csrfToken && !force) return csrfToken;

    const response = await fetch(`${API_URL}/api/auth/csrf`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new ApiError("Não foi possível iniciar uma sessão segura.", response.status);
    }

    const data = await response.json() as { requestToken: string };
    csrfToken = data.requestToken;
    return csrfToken;
}

async function refreshSession(): Promise<boolean> {
    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            try {
                const token = await loadCsrfToken();
                const response = await fetch(`${API_URL}/api/auth/refresh`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "X-CSRF-TOKEN": token, Accept: "application/json" },
                });
                return response.ok;
            } catch {
                return false;
            } finally {
                refreshInFlight = null;
            }
        })();
    }

    return refreshInFlight;
}

async function parseError(response: Response): Promise<ApiError> {
    const payload = await response.json().catch(() => null) as
        | { detail?: string; message?: string; title?: string }
        | null;
    const message = payload?.detail || payload?.message || payload?.title ||
        (response.status === 401
            ? "Sua sessão expirou. Entre novamente."
            : "Não foi possível concluir a operação.");

    return new ApiError(message, response.status, payload);
}

export async function api<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    retried = false,
): Promise<T> {
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (isUnsafe(method)) {
        headers.set("X-CSRF-TOKEN", await loadCsrfToken());
    }

    const response = await fetch(`${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
        ...options,
        method,
        headers,
        credentials: "include",
    });

    const endpointPath = endpoint.split("?")[0];
    const canRefresh = ![
        "/api/auth/csrf",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/logout",
    ].includes(endpointPath);
    if (response.status === 401 && !retried && canRefresh) {
        const refreshed = await refreshSession();
        if (refreshed) return api<T>(endpoint, options, true);
        notifySessionExpired();
    } else if (response.status === 401 && retried && canRefresh) {
        notifySessionExpired();
    }

    if (response.status === 403) notifyForbidden(endpointPath);

    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return null as T;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null as T;
    return await response.json() as T;
}

export async function apiBlob(endpoint: string, retried = false): Promise<Blob> {
    const response = await fetch(`${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/octet-stream" },
    });

    const endpointPath = endpoint.split("?")[0];
    const canRefresh = ![
        "/api/auth/csrf",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/logout",
    ].includes(endpointPath);

    if (response.status === 401 && !retried && canRefresh) {
        const refreshed = await refreshSession();
        if (refreshed) return apiBlob(endpoint, true);
        notifySessionExpired();
    } else if (response.status === 401 && retried && canRefresh) {
        notifySessionExpired();
    }

    if (response.status === 403) notifyForbidden(endpointPath);
    if (!response.ok) throw await parseError(response);
    return response.blob();
}

export const apiGet = <T>(endpoint: string) => api<T>(endpoint);

export const apiPost = <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPut = <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPatch = <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiDelete = <T = void>(endpoint: string) =>
    api<T>(endpoint, { method: "DELETE" });
