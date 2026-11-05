import type { ApiEnvelope } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5000/api/v1";
const TEST_API_KEY = (import.meta.env.VITE_TEST_API_KEY as string | undefined) ?? "";

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  csrf?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.csrf && csrfToken) headers["X-CSRF-Token"] = csrfToken;
  if (TEST_API_KEY) headers["X-Test-API-Key"] = TEST_API_KEY;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Cannot reach the server. Is the backend running?", 0, "NETWORK_ERROR");
  }

  let payload: ApiEnvelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      // Non-JSON response — leave payload null.
    }
  }

  if (!res.ok || !payload || payload.success === false) {
    const message = payload?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return payload.data as T;
}

export const api = {
  baseUrl: API_BASE_URL,
  raw: request,
};
