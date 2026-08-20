import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import { logStorefrontApi } from '@/features/ecommerce/storefront/lib/debug-storefront-api';

/**
 * When true (default), storefront/admin use Nest store APIs only.
 * Set `NEXT_PUBLIC_STORE_HTTP=false` only for emergency offline demos —
 * mock/seed fallbacks are removed; false disables store HTTP calls (empty/error).
 */
export function isStoreHttpEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STORE_HTTP !== 'false';
}

export type StorePaginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const EMPTY_PAGINATION = { page: 1, limit: 200, total: 0, totalPages: 0 };

/** Binding §1 — list `data` is always `{ items, pagination }`. */
export function unwrapStoreList<T>(value: unknown): StorePaginated<T> {
  if (!value || typeof value !== 'object') {
    return { items: [], pagination: EMPTY_PAGINATION };
  }
  const record = value as { items?: unknown; pagination?: StorePaginated<T>['pagination'] };
  if (!Array.isArray(record.items)) {
    return { items: [], pagination: record.pagination ?? EMPTY_PAGINATION };
  }
  return {
    items: record.items as T[],
    pagination: record.pagination ?? {
      ...EMPTY_PAGINATION,
      total: record.items.length,
      totalPages: 1,
      limit: record.items.length || 200,
    },
  };
}

export function unwrapApiEnvelope<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { status?: number; data?: T; error?: unknown };
  const statusOk =
    typeof record.status === 'number' && record.status >= 200 && record.status < 300;
  if (statusOk && 'data' in record && record.data != null && record.error == null) {
    return record.data;
  }
  return payload as T;
}

export class StoreHttpError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'StoreHttpError';
    this.status = status;
    this.payload = payload;
  }
}

type QueryValue = string | number | boolean | null | undefined;

/** Matches `export const revalidate = 60` on public storefront routes. */
export const STOREFRONT_PUBLIC_REVALIDATE_SECONDS = 60;

export function storefrontPublicFetchInit(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
): Pick<RequestInit, 'cache' | 'next'> {
  if (method === 'GET') {
    return { next: { revalidate: STOREFRONT_PUBLIC_REVALIDATE_SECONDS } };
  }
  return { cache: 'no-store' };
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return `${base}${normalized}${qs ? `?${qs}` : ''}`;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as { message?: string | string[] };
  if (Array.isArray(record.message)) return record.message.join(' · ') || fallback;
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  return fallback;
}

/** Public storefront fetch (no employee token). Optional partner Bearer for wishlist/orders. */
export async function publicStoreRequest<T>(
  path: string,
  init: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    query?: Record<string, QueryValue>;
    body?: unknown;
    token?: string | null;
    headers?: Record<string, string>;
    /** When true, 404 returns null instead of throwing. */
    nullOn404?: boolean;
  } = {},
): Promise<T | null> {
  const method = init.method ?? 'GET';
  const url = buildUrl(path, init.query);
  const headers = new Headers({ Accept: 'application/json', ...(init.headers ?? {}) });
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...storefrontPublicFetchInit(method),
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

    if (response.status === 204) {
      logStorefrontApi({ url, status: 204, ok: true });
      return null;
    }

    let payload: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      logStorefrontApi({ url, status: response.status, ok: false, data: payload });
      if (init.nullOn404 && response.status === 404) return null;
      throw new StoreHttpError(
        extractErrorMessage(payload, `HTTP ${response.status}`),
        response.status,
        payload,
      );
    }

    const data = unwrapApiEnvelope<T>(payload);
    logStorefrontApi({ url, status: response.status, ok: true, data });
    return data;
  } catch (error) {
    if (error instanceof StoreHttpError) throw error;
    const cause = error instanceof Error && 'cause' in error ? error.cause : undefined;
    const causeCode =
      cause && typeof cause === 'object' && 'code' in cause
        ? String((cause as { code?: unknown }).code)
        : undefined;
    const message =
      error instanceof Error
        ? [error.message, causeCode].filter(Boolean).join(' · ')
        : 'fetch failed';
    logStorefrontApi({ url, ok: false, error });
    throw new StoreHttpError(message, 0, { url, cause: causeCode ?? cause });
  }
}

export function toDecimalString(value: number | string | null | undefined, fallback = '0'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return String(n);
}

export function fromDecimalString(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}
