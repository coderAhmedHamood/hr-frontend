import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  accessTokenRefreshDue,
  clearAccessTokenCookie,
  getAccessTokenFromCookie,
  setAccessTokenCookie,
} from '@/features/auth/lib/auth-cookie';
import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';

const SKIP_REFRESH_PREFIXES = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/request-activation',
  '/auth/activate',
  '/auth/mobile-serial',
  '/public/',
];

/** Login and other anonymous calls must not try to renew a session. */
export function shouldRenewSessionForPath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return !SKIP_REFRESH_PREFIXES.some((prefix) =>
    prefix.endsWith('/')
      ? normalized.startsWith(prefix)
      : normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

function refreshUrl(): string {
  const base = resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
  return `${base}/auth/refresh`;
}

let inflight: Promise<boolean> | null = null;

/**
 * Exchanges the current staff JWT for a new one. One shared request, so a
 * burst of 401s does not stampede the server. Returns false when there is
 * nothing to renew or the server refused (revoked, too old, forged).
 */
export function refreshAccessSession(): Promise<boolean> {
  if (!inflight) {
    inflight = renewOnce().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function renewOnce(): Promise<boolean> {
  const token = getAccessTokenFromCookie();
  if (!token || typeof window === 'undefined') return false;

  try {
    const response = await fetch(refreshUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const payload: unknown = await response.json();
    const accessToken = readAccessToken(payload);
    if (!accessToken) return false;
    setAccessTokenCookie(accessToken);
    return true;
  } catch {
    return false;
  }
}

function readAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { access_token?: unknown; data?: { access_token?: unknown } };
  if (typeof record.access_token === 'string' && record.access_token.trim()) {
    return record.access_token.trim();
  }
  const nested = record.data?.access_token;
  if (typeof nested === 'string' && nested.trim()) return nested.trim();
  return null;
}

/** Drops the local session after the server has refused to renew it. */
export function abandonStaffSession(): void {
  clearAccessTokenCookie();
  useAuthStore.getState().clear();
}

/**
 * While the console is open, renew the JWT before it expires. The check is
 * local (decode `exp`); the network call happens only inside the lead window.
 */
export function startSessionKeepAlive(): () => void {
  const tick = () => {
    if (accessTokenRefreshDue()) {
      void refreshAccessSession();
    }
  };

  tick();
  const id = window.setInterval(tick, 30_000);
  const onVisible = () => {
    if (document.visibilityState === 'visible') tick();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', tick);

  return () => {
    window.clearInterval(id);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', tick);
  };
}
