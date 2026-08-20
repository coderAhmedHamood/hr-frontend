/**
 * Which login screen a session-expiry redirect should land on.
 *
 * The shop and the ERP console are two different products sharing one Next
 * app, and they have two different login pages. Sending a shopper to the
 * console sign-in is a dead end — they have no account there — so any
 * redirect that fires from a storefront page must stay inside the shop.
 */

/** Locale prefix of the current path, e.g. `/ar` — empty in Arabic-only mode. */
function localePrefixOf(pathname: string): string {
  const match = /^\/([a-z]{2})(?:\/|$)/.exec(pathname);
  return match ? `/${match[1]}` : '';
}

/** True when this path belongs to the public storefront. */
export function isStorefrontLocation(pathname: string): boolean {
  return /^\/(?:[a-z]{2}\/)?store(?:\/|$)/.test(pathname);
}

/**
 * Login URL for wherever the visitor currently is, carrying `returnTo` so the
 * flow resumes after sign-in. Falls back to the console login off-storefront.
 */
export function loginHrefForLocation(pathname: string, returnTo: string): string {
  const encoded = encodeURIComponent(returnTo);
  return isStorefrontLocation(pathname)
    ? `${localePrefixOf(pathname)}/store/login?returnTo=${encoded}`
    : `/login?returnTo=${encoded}`;
}

/** Browser-side convenience: current location in, login URL out. */
export function currentLoginHref(): string {
  const { pathname, search } = window.location;
  return loginHrefForLocation(pathname, pathname + search);
}
