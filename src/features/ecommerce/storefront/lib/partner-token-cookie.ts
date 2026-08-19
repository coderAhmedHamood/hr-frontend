/** Cookie mirrors zustand partner JWT so RSC/SSR can call partner-scoped store APIs. */
export const PARTNER_TOKEN_COOKIE = 'storefront_partner_token';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function writePartnerTokenCookie(token: string | null | undefined): void {
  if (typeof document === 'undefined') return;
  if (!token) {
    document.cookie = `${PARTNER_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie =
    `${PARTNER_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export async function readPartnerTokenCookie(): Promise<string | null> {
  const { cookies } = await import('next/headers');
  const jar = await cookies();
  const raw = jar.get(PARTNER_TOKEN_COOKIE)?.value;
  if (!raw?.trim()) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
