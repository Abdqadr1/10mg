import { getToken, useAuthStore } from "@/stores/auth-store";
import type { ApiErrorBody } from "@/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  tenant?: string;
}

function baseUrl() {
  return typeof window !== "undefined" ? window.location.origin : "http://localhost";
}

export async function apiFetch<T>(path: string, { method = "GET", body, tenant }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tenant ? getToken(tenant) : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const error = (payload ?? {}) as Partial<ApiErrorBody>;
    if (response.status === 401 && tenant) useAuthStore.getState().clearSession(tenant);
    throw new ApiError(response.status, error.message ?? `Request failed (${response.status})`, error.fieldErrors);
  }
  return payload as T;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
