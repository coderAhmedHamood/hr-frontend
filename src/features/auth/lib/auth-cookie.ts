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
