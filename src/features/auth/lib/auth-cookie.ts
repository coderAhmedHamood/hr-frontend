const ACCESS_TOKEN_COOKIE = 'access_token';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function cookieFlags(): string {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function decodeCookieValue(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Browser-only cookie read (document.cookie). Prefer `resolveAccessToken` in shared API clients. */
export function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const prefix = `${ACCESS_TOKEN_COOKIE}=`;
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));

  if (!match) return null;

  const raw = match.slice(prefix.length);
  if (!raw) return null;

  return decodeCookieValue(raw);
}

/**
 * Access token for browser *or* Server Actions / RSC.
 * Uses `document.cookie` on the client and `next/headers` cookies on the server.
 */
export async function resolveAccessToken(): Promise<string | null> {
  if (typeof document !== 'undefined') {
    return getAccessTokenFromCookie();
  }

  try {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const raw = store.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!raw) return null;
    return decodeCookieValue(raw);
  } catch {
    return null;
  }
}

export function setAccessTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; ${cookieFlags()}`;
}

export function clearAccessTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasAccessTokenCookie(): boolean {
  return !!getAccessTokenFromCookie();
}

export type AccessTokenTimes = {
  /** Milliseconds since epoch, from the JWT `exp` claim. */
  expMs: number;
  /** Milliseconds since epoch, from the JWT `iat` claim. Falls back to `expMs`. */
  iatMs: number;
};

/** Reads `exp` / `iat` from the cookie JWT. Does not verify the signature. */
export function readAccessTokenTimes(): AccessTokenTimes | null {
  const token = getAccessTokenFromCookie();
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as { exp?: unknown; iat?: unknown };
    if (typeof json.exp !== 'number' || !Number.isFinite(json.exp)) return null;
    const expMs = json.exp * 1000;
    const iatMs =
      typeof json.iat === 'number' && Number.isFinite(json.iat) ? json.iat * 1000 : expMs;
    return { expMs, iatMs };
  } catch {
    return null;
  }
}

/**
 * True when the current token should be renewed before it expires.
 * The lead is 10 minutes, but never more than half the token's own lifetime,
 * so a short-lived token is not refreshed in a loop.
 */
export function accessTokenRefreshDue(now = Date.now()): boolean {
  const times = readAccessTokenTimes();
  if (!times) return false;
  const lifetime = Math.max(0, times.expMs - times.iatMs);
  const half = Math.floor(lifetime / 2);
  const lead = Math.min(10 * 60 * 1000, Math.max(60_000, half));
  return times.expMs - now <= lead;
}
