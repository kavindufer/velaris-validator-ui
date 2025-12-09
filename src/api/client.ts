export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const TOKEN_KEY = "vv_access_token";

export function getStoredToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function storeToken(token: string) {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {
        // ignore
    }
}

export function clearToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {
        // ignore
    }
}

function buildUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    const base = API_BASE_URL.replace(/\/+$/, "");
    const rel = path.replace(/^\/+/, "");
    return `${base}/${rel}`;
}

export class ApiError extends Error {
    status: number;
    details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
    body?: unknown;
    signal?: AbortSignal;
    onUnauthorized?: () => void;
    // if true, don't attach Authorization even if token exists
    skipAuth?: boolean;
}

async function apiRequest<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const { body, signal, onUnauthorized, skipAuth } = options;

    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    let requestBody: BodyInit | undefined;

    if (body instanceof FormData) {
        requestBody = body;
    } else if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
    }

    const token = !skipAuth ? getStoredToken() : null;
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildUrl(path), {
        method,
        headers,
        body: requestBody,
        signal,
    });

    if (response.status === 401 && onUnauthorized) {
        onUnauthorized();
    }

    if (!response.ok) {
        let details: unknown;
        try {
            details = await response.json();
        } catch {
            details = undefined;
        }
        const message =
            (details as any)?.detail ||
            (details as any)?.message ||
            `API request failed with status ${response.status}`;
        throw new ApiError(message, response.status, details);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();
    if (!text) {
        return undefined as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        // fallback if backend returns non-JSON
        return text as unknown as T;
    }
}

export function apiGet<T>(
    path: string,
    options?: Omit<RequestOptions, "body">,
): Promise<T> {
    return apiRequest<T>("GET", path, options);
}

export function apiPost<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "body">,
): Promise<T> {
    return apiRequest<T>("POST", path, { ...options, body });
}

export function apiPut<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "body">,
): Promise<T> {
    return apiRequest<T>("PUT", path, { ...options, body });
}

export function apiPatch<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "body">,
): Promise<T> {
    return apiRequest<T>("PATCH", path, { ...options, body });
}

// --- Auth-specific helpers ---

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export async function loginWithPassword(
    email: string,
    password: string,
): Promise<LoginResponse> {
    const form = new URLSearchParams();
    // FastAPI OAuth2PasswordRequestForm expects "username" and "password"
    form.set("username", email);
    form.set("password", password);

    const res = await fetch(buildUrl("/auth/login"), {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
    });

    if (!res.ok) {
        let details: unknown;
        try {
            details = await res.json();
        } catch {
            details = undefined;
        }
        const message =
            (details as any)?.detail ||
            (details as any)?.message ||
            `Login failed with status ${res.status}`;
        throw new ApiError(message, res.status, details);
    }

    const data = (await res.json()) as LoginResponse;
    return data;
}

export interface DevBootstrapRequest {
    tenant_name?: string;
    admin_email?: string;
    admin_password?: string;
}

export interface DevBootstrapResponse {
    tenant_id: string;
    admin_user_id: string;
    admin_email: string;
    access_token: string;
}

export async function devBootstrap(
    body?: DevBootstrapRequest,
): Promise<DevBootstrapResponse> {
    const res = await fetch(buildUrl("/auth/dev/bootstrap"), {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
    });

    if (!res.ok) {
        let details: unknown;
        try {
            details = await res.json();
        } catch {
            details = undefined;
        }

        const message =
            (details as any)?.detail ??
            (details as any)?.message ??
            `Dev bootstrap failed with status ${res.status}`;

        throw new ApiError(message, res.status, details);
    }

    const data = (await res.json()) as DevBootstrapResponse;
    return data;
}

// minimal shape of /auth/me response
export interface CurrentUser {
    id: string;
    email: string;
    role?: string;
    tenant_id?: string;
}

export async function fetchCurrentUser(
    onUnauthorized?: () => void,
): Promise<CurrentUser> {
    return apiGet<CurrentUser>("/auth/me", { onUnauthorized });
}
