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

const rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "https://localhost:7285" : "");

if (!rawApiUrl) {
    throw new Error("A variável de ambiente VITE_API_URL não foi definida.");
}

const API_URL = rawApiUrl.replace(/\/$/, "");

let csrfToken: string | null = null;
let csrfTokenRequest: Promise<string> | null = null;
let csrfTokenRequestVersion = 0;
let refreshInFlight: Promise<boolean> | null = null;

export const AUTH_SESSION_EXPIRED_EVENT = "app:auth-session-expired";
export const API_FORBIDDEN_EVENT = "app:api-forbidden";
export const API_READ_STARTED_EVENT = "app:api-read-started";
export const API_READ_FINISHED_EVENT = "app:api-read-finished";
export const API_READ_FAILURE_EVENT = "app:api-read-failure";

function notifyApiReadFailure(endpoint: string, message: string) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(API_READ_FAILURE_EVENT, {
            detail: { endpoint, message },
        }));
    }
}

async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    endpoint: string,
    monitorarLeitura: boolean,
): Promise<Response> {
    const controller = new AbortController();
    let expirou = false;
    const timeout = setTimeout(() => {
        expirou = true;
        controller.abort();
    }, 15_000);

    if (monitorarLeitura && typeof window !== "undefined") {
        window.dispatchEvent(new Event(API_READ_STARTED_EVENT));
    }

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (monitorarLeitura && response.status >= 400 && response.status !== 401 && response.status !== 403) {
            notifyApiReadFailure(
                endpoint,
                response.status >= 500
                    ? "A API está indisponível no momento. A tela não conseguiu carregar os dados."
                    : `A API retornou o erro ${response.status} ao carregar os dados da tela.`,
            );
        }
        return response;
    } catch (error) {
        const message = expirou
            ? "A API demorou mais de 15 segundos para responder. A tela não conseguiu carregar os dados."
            : "A conexão com a API foi interrompida. Verifique se o servidor está ativo e tente novamente.";
        if (monitorarLeitura) notifyApiReadFailure(endpoint, message);
        throw new ApiError(message, 0, error);
    } finally {
        clearTimeout(timeout);
        if (monitorarLeitura && typeof window !== "undefined") {
            window.dispatchEvent(new Event(API_READ_FINISHED_EVENT));
        }
    }
}

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
    if (csrfTokenRequest && !force) return csrfTokenRequest;

    const version = ++csrfTokenRequestVersion;
    const request = (async () => {
        const response = await fetchWithTimeout(`${API_URL}/api/auth/csrf`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
        }, "/api/auth/csrf", false);

        if (!response.ok) {
            throw new ApiError("Não foi possível iniciar uma sessão segura.", response.status);
        }

        const data = await response.json() as { requestToken: string };
        // Chamadas simultâneas compartilham a mesma emissão para manter cookie e token pareados.
        if (version === csrfTokenRequestVersion) csrfToken = data.requestToken;
        return data.requestToken;
    })();

    csrfTokenRequest = request;
    try {
        return await request;
    } finally {
        if (csrfTokenRequest === request) csrfTokenRequest = null;
    }
}

async function refreshSession(): Promise<boolean> {
    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            try {
                const token = await loadCsrfToken();
                const response = await fetchWithTimeout(`${API_URL}/api/auth/refresh`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "X-CSRF-TOKEN": token, Accept: "application/json" },
                }, "/api/auth/refresh", false);
                if (response.ok) csrfToken = null;
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

async function isCsrfFailure(response: Response): Promise<boolean> {
    if (response.status !== 400) return false;

    const payload = await response.clone().json().catch(() => null) as
        | { message?: string }
        | null;
    return payload?.message?.includes("Token de segurança ausente ou inválido") ?? false;
}

export async function api<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    retried = false,
    csrfRetried = false,
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

    const endpointPath = endpoint.split("?")[0];
    const response = await fetchWithTimeout(`${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
        ...options,
        method,
        headers,
        credentials: "include",
    }, endpointPath, method === "GET" && !endpointPath.startsWith("/api/auth/"));

    if (response.ok && ["/api/auth/login", "/api/auth/register", "/api/auth/logout"].includes(endpointPath)) {
        // O token anterior pode ter sido emitido para a identidade anônima ou para a sessão encerrada.
        csrfToken = null;
    }

    if (!csrfRetried && await isCsrfFailure(response)) {
        // Recria o par cookie/token antes de repetir a operação que foi barrada pelo middleware.
        csrfToken = null;
        await loadCsrfToken(true);
        return api<T>(endpoint, options, retried, true);
    }

    const canRefresh = ![
        "/api/auth/csrf",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/logout",
    ].includes(endpointPath);
    if (response.status === 401 && !retried && canRefresh) {
        const refreshed = await refreshSession();
        if (refreshed) return api<T>(endpoint, options, true, csrfRetried);
        notifySessionExpired();
    } else if (response.status === 401 && retried && canRefresh) {
        notifySessionExpired();
    }

    if (response.status === 403) notifyForbidden(endpointPath);

    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return null as T;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null as T;
    try {
        return await response.json() as T;
    } catch (error) {
        if (method === "GET" && !endpointPath.startsWith("/api/auth/")) {
            notifyApiReadFailure(
                endpointPath,
                "A API respondeu, mas enviou dados inválidos. A tela não conseguiu ser montada.",
            );
        }
        throw new ApiError("A API retornou uma resposta inválida.", response.status, error);
    }
}

export async function apiBlob(endpoint: string, retried = false): Promise<Blob> {
    const endpointPath = endpoint.split("?")[0];
    const response = await fetchWithTimeout(`${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/octet-stream" },
    }, endpointPath, !endpointPath.startsWith("/api/auth/"));

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

export const apiDelete = <T = void>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, {
        method: "DELETE",
        body: body === undefined ? undefined : JSON.stringify(body),
    });
