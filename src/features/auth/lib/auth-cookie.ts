const ACCESS_TOKEN_COOKIE = 'access_token';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function cookieFlags(): string {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const prefix = `${ACCESS_TOKEN_COOKIE}=`;
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));

  if (!match) return null;

  const raw = match.slice(prefix.length);
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
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
