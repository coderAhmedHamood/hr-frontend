import { getAccessTokenFromCookie } from '@/features/auth/lib/auth-cookie';
import { publicConfig } from '@/shared/config';
import type { ApiErrorEnvelope, ApiSuccessEnvelope } from '@/features/hr/lib/api/types';
import { isApiErrorEnvelope, isApiSuccessEnvelope } from '@/features/hr/lib/api/types';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 200,
  total: 0,
  totalPages: 0,
};

/** Guards list endpoints when `data` is missing or malformed. */
export function ensurePaginatedResult<T>(
  value: PaginatedResult<T> | null | undefined,
): PaginatedResult<T> {
  if (!value || !Array.isArray(value.items)) {
    return { items: [], pagination: value?.pagination ?? EMPTY_PAGINATION };
  }
  return value;
}

/** Fetches every page from a paginated list endpoint (200 items per request by default). */
export async function fetchAllPaginatedItems<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResult<T>>,
  limit = 200,
): Promise<{ items: T[]; total: number }> {
  const first = ensurePaginatedResult(await fetchPage(1, limit));
  const items = [...first.items];
  const totalPages = Math.max(first.pagination.totalPages, 1);
  for (let page = 2; page <= totalPages; page += 1) {
    const next = ensurePaginatedResult(await fetchPage(page, limit));
    items.push(...next.items);
  }
  return { items, total: first.pagination.total };
}

export class ApiError extends Error {
  status: number;
  /** Raw JSON body from fetch (same as Network tab). */
  payload: unknown;
  /** Parsed backend error envelope when present. */
  envelope: ApiErrorEnvelope | null;

  constructor(envelope: ApiErrorEnvelope | null, status: number, payload?: unknown) {
    super(envelope?.message ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.envelope = envelope;
    this.payload = payload ?? envelope;
  }
}

type QueryValue = string | number | boolean | null | undefined;

function buildQuery(query?: Record<string, QueryValue>) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveApiBaseUrl(publicConfig.apiUrl);
  const urlBase = baseUrl ? baseUrl.replace(/\/$/, '') : '';
  return `${urlBase}${normalizedPath}${buildQuery(query)}`;
}

function resolveApiBaseUrl(configuredUrl: string) {
  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const currentHost = window.location.hostname;
  const isLocalPage = currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '::1';
  if (isLocalPage) {
    return configuredUrl;
  }

  try {
    const apiHost = new URL(configuredUrl).hostname;
    const isLocalApi = apiHost === 'localhost' || apiHost === '127.0.0.1' || apiHost === '::1';
    return isLocalApi ? '/api-backend' : configuredUrl;
  } catch {
    return configuredUrl;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
};

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    return payload as T;
  }

  if (isApiSuccessEnvelope(payload)) {
    return (payload.data ?? ({} as T)) as T;
  }

  const record = payload as ApiSuccessEnvelope<T> & { success?: boolean };
  if ('data' in record && record.success === true) {
    return (record.data ?? ({} as T)) as T;
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAccessTokenFromCookie();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    let envelope: ApiErrorEnvelope;
    if (isApiErrorEnvelope(payload)) {
      envelope = payload;
    } else if (payload && typeof payload === 'object') {
      const body = payload as Record<string, unknown>;
      const nestedMsg = body.message;
      const message =
        typeof nestedMsg === 'string'
          ? nestedMsg
          : Array.isArray(nestedMsg)
            ? nestedMsg.map(String).join('; ')
            : response.statusText || 'Request failed';
      envelope = {
        status: typeof body.status === 'number' ? body.status : response.status,
        message,
        data: null,
        error: body.error ?? body,
      };
    } else {
      envelope = {
        status: response.status,
        message: response.statusText || 'Request failed',
        data: null,
        error: payload,
      };
    }
    throw new ApiError(envelope, response.status, payload);
  }

  return unwrapEnvelope<T>(payload);
}
