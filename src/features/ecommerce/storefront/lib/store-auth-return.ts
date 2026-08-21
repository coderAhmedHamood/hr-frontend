import { routing } from '@/i18n/routing';

const LOCALE_PREFIX = new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`);

/**
 * Allow only same-app store paths as post-auth redirects (open-redirect safe).
 *
 * Accepts both `/store/…` and the locale-prefixed `/ar/store/…` that
 * `window.location.pathname` actually carries, returning the unprefixed form —
 * next-intl's router adds the prefix back on navigation. Without this, a
 * perfectly valid `/ar/store/checkout` failed the `/store` test and silently
 * became `/store/account`, dropping shoppers on their profile instead of the
 * page they were headed to.
 */
export function resolveStoreAuthReturnTo(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value.startsWith('/')) return '/store/account';
  // Protocol-relative (`//evil.com`) and absolute URLs are never ours.
  if (value.startsWith('//') || value.includes('://')) return '/store/account';

  const path = value.replace(LOCALE_PREFIX, '');
  if (path !== '/store' && !path.startsWith('/store/')) return '/store/account';
  return path;
}

export function storeLoginHref(returnTo?: string | null): string {
  const target = resolveStoreAuthReturnTo(returnTo);
  if (target === '/store/account') return '/store/login';
  return `/store/login?returnTo=${encodeURIComponent(target)}`;
}

export function storeRegisterHref(returnTo?: string | null): string {
  const target = resolveStoreAuthReturnTo(returnTo);
  if (target === '/store/account') return '/store/register';
  return `/store/register?returnTo=${encodeURIComponent(target)}`;
}
