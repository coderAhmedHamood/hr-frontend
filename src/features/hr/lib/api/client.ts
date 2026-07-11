import { getAccessTokenFromCookie } from '@/features/auth/lib/auth-cookie';
import { extractApiErrorMessage } from '@/features/auth/lib/auth-api-messages';
import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import {
  parseContentDispositionFilename,
  triggerBrowserDownload,
} from '@/shared/export/download-blob';
import type { ApiErrorEnvelope, ApiSuccessEnvelope } from '@/features/hr/lib/api/types';
import { isApiErrorEnvelope, isApiSuccessEnvelope } from '@/features/hr/lib/api/types';
import { reportError } from '@/shared/errors/report-error';
import { toast } from 'sonner';

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

/** Expected API failure — intentionally does not extend `Error` to avoid Next.js runtime overlays. */
export class ApiError {
  readonly name = 'ApiError';
  message: string;
  status: number;
  /** Raw JSON body from fetch (same as Network tab). */
  payload: unknown;
  /** Parsed backend error envelope when present. */
  envelope: ApiErrorEnvelope | null;
  /** True when the client already surfaced this failure in a toast. */
  toastShown?: boolean;

  constructor(envelope: ApiErrorEnvelope | null, status: number, payload?: unknown) {
    this.message = envelope?.message ?? `HTTP ${status}`;
    this.status = status;
    this.envelope = envelope;
    this.payload = payload ?? envelope;
  }
}

type QueryValue = string | number | boolean | null | undefined | string[];

function buildQuery(query?: Record<string, QueryValue>) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      params.set(key, value.join(','));
      return;
    }
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

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
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
    cache: 'no-store',
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
    return handleApiResponseFailure(
      buildApiErrorEnvelope(payload, response),
      response.status,
      payload,
      method,
    );
  }

  return unwrapEnvelope<T>(payload);
}

function handleApiResponseFailure<T>(
  envelope: ApiErrorEnvelope,
  status: number,
  payload: unknown,
  method: RequestOptions['method'],
): T {
  notifyApiFailure(envelope, status);

  // Reads: toast only — return an empty paginated shell so list loaders never crash.
  if (method === 'GET') {
    return ensurePaginatedResult(undefined) as T;
  }

  const error = new ApiError(envelope, status, payload);
  error.toastShown = true;
  throw error;
}

function buildApiErrorEnvelope(payload: unknown, response: Response): ApiErrorEnvelope {
  if (isApiErrorEnvelope(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    const nestedMsg = body.message;
    const message =
      typeof nestedMsg === 'string'
        ? nestedMsg
        : Array.isArray(nestedMsg)
          ? nestedMsg.map(String).join('; ')
          : response.statusText || 'Request failed';
    return {
      status: typeof body.status === 'number' ? body.status : response.status,
      message,
      data: null,
      error: body.error ?? body,
    };
  }
  return {
    status: response.status,
    message: response.statusText || 'Request failed',
    data: null,
    error: payload,
  };
}

function notifyApiFailure(envelope: ApiErrorEnvelope, status: number): void {
  const displayMessage =
    status === 403
      ? 'ليس لديك صلاحية للوصول إلى هذا المورد'
      : extractApiErrorMessage(envelope, `HTTP ${status}`);

  if (status >= 500) {
    reportError(new ApiError(envelope, status), 'api-error', undefined, { skipToast: true });
  }

  if (status === 401 && typeof window !== 'undefined') {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?returnTo=${returnTo}`);
    return;
  }

  toast.error(displayMessage);
}

/** Multipart upload (do not set Content-Type — browser sets boundary). */
export async function apiFormRequest<T>(path: string, formData: FormData, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getAccessTokenFromCookie();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers,
    body: formData,
    signal,
    credentials: 'include',
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return handleApiResponseFailure(
      buildApiErrorEnvelope(payload, response),
      response.status,
      payload,
      'POST',
    );
  }

  return unwrapEnvelope<T>(payload);
}

export type ApiDownloadResult = {
  blob: Blob;
  fileName: string;
  headers: Record<string, string>;
};

/** Binary download — parses filename from Content-Disposition when present. */
export async function apiDownloadRequest(
  path: string,
  options: RequestOptions & { defaultFileName?: string } = {},
): Promise<ApiDownloadResult> {
  const { method = 'GET', query, body, signal, defaultFileName = 'download' } = options;
  const headers: Record<string, string> = { Accept: '*/*' };
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

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    let envelope: ApiErrorEnvelope;
    if (isApiErrorEnvelope(payload)) {
      envelope = payload;
    } else if (payload && typeof payload === 'object') {
      const errBody = payload as Record<string, unknown>;
      const nestedMsg = errBody.message;
      const message =
        typeof nestedMsg === 'string'
          ? nestedMsg
          : Array.isArray(nestedMsg)
            ? nestedMsg.map(String).join('; ')
            : response.statusText || 'Request failed';
      envelope = {
        status: typeof errBody.status === 'number' ? errBody.status : response.status,
        message,
        data: null,
        error: errBody.error ?? errBody,
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

  const blob = await response.blob();
  const fileName =
    parseContentDispositionFilename(response.headers.get('content-disposition'))
    ?? defaultFileName;

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key.toLowerCase()] = value;
  });

  return { blob, fileName, headers: responseHeaders };
}

export type ApiDownloadToDeviceResult = {
  fileName: string;
  headers: Record<string, string>;
};

/** Fetch a binary file and trigger browser download. */
export async function apiDownloadToDevice(
  path: string,
  options: RequestOptions & { defaultFileName?: string } = {},
): Promise<ApiDownloadToDeviceResult> {
  const { blob, fileName, headers } = await apiDownloadRequest(path, options);
  triggerBrowserDownload(blob, fileName);
  return { fileName, headers };
}
