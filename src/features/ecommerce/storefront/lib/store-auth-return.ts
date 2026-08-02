/** Allow only same-app store paths as post-auth redirects (open-redirect safe). */
export function resolveStoreAuthReturnTo(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value.startsWith('/store')) return '/store/account';
  if (value.startsWith('//')) return '/store/account';
  if (value.includes('://')) return '/store/account';
  return value;
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
