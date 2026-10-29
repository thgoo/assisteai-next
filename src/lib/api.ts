import { API_INTERNAL_URL, API_URL } from './config';

/** A non-2xx response. `detail` is the problem's user-facing message (pt-BR), when the API sends one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail?: string,
  ) {
    super(detail ?? `API responded with ${status}`);
    this.name = 'ApiError';
  }
}

/** Calls the API with the session cookie. Errors are RFC 9457 problems, thrown as `ApiError`. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = typeof window === 'undefined' ? API_INTERNAL_URL : API_URL;
  const res = await fetch(`${baseUrl}${path}`, {
    // Server reads are cached by `'use cache'` (src/lib/movies.ts); a fetch cache under it would outlive deploys
    cache: 'no-store',
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(res.status, problem?.detail);
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}
