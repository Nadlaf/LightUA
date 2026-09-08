import type { ErrorResponseDto } from './models';

const BASE = import.meta.env.VITE_API_URL ?? '';

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

export type ApiErrorCode = 'notFound' | 'badRequest' | 'server' | 'network' | 'unknown';

/**
 * Transport-level failure. Carries a machine-readable `code` so the UI can pick
 * a translation key instead of rendering whatever prose the server sent.
 * `serverMessage` is kept only as a last-resort fallback.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly serverMessage?: string;

  constructor(status: number, code: ApiErrorCode, serverMessage?: string) {
    super(serverMessage ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.serverMessage = serverMessage;
  }
}

const codeForStatus = (status: number): ApiErrorCode => {
  if (status === HTTP_NOT_FOUND) return 'notFound';
  if (status === HTTP_BAD_REQUEST) return 'badRequest';
  if (status >= HTTP_SERVER_ERROR) return 'server';
  return 'unknown';
};

const readServerMessage = async (res: Response): Promise<string | undefined> => {
  try {
    const body = (await res.json()) as Partial<ErrorResponseDto>;
    return body.error;
  } catch {
    // Body was absent or not JSON; the status code is all we have.
    return undefined;
  }
};

const request = async (path: string): Promise<Response> => {
  try {
    return await fetch(`${BASE}${path}`);
  } catch {
    // fetch only rejects on network-level failures, never on HTTP status.
    throw new ApiError(0, 'network');
  }
};

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await request(path);
  if (!res.ok) throw new ApiError(res.status, codeForStatus(res.status), await readServerMessage(res));
  return res.json() as Promise<T>;
}

/**
 * Same as apiFetch but resolves to null on 404. Used for availability probes,
 * where "absent" is an expected answer rather than a failure — the API returns
 * 404 for a day it simply has no data for.
 */
export async function apiFetchOrNull<T>(path: string): Promise<T | null> {
  const res = await request(path);
  if (res.status === HTTP_NOT_FOUND) return null;
  if (!res.ok) throw new ApiError(res.status, codeForStatus(res.status), await readServerMessage(res));
  return res.json() as Promise<T>;
}
