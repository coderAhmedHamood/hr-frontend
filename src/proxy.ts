import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Next.js 16: this file must be `proxy.ts` only — do not add `middleware.ts`.
 *
 * Two jobs:
 *  1. Host split — the storefront owns the bare domain (qutb.tech), the ERP
 *     console lives on `admin.` of that same domain. Both are served by this
 *     one Next app; only the hostname decides which side a visitor sees.
 *  2. Locale routing for the public storefront (next-intl). ERP routes are
 *     never locale-prefixed, so they must not pass through the locale
 *     middleware — it would redirect `/hr` to `/ar/hr` and break the console.
 */
const handleLocale = createMiddleware(routing);

/** First path segment of every ERP console route. Anything here is admin-only. */
const ADMIN_SEGMENTS = new Set([
  'login',
  'pos',
  'hr',
  'system',
  'system-owner',
  'accounting',
  'company-apps',
  'contacts',
  'inventory',
  'overview',
  'products',
  'categories',
  'brands',
  'attributes',
  'orders',
  'reviews',
  'reports',
  'cms',
]);

/** Where the bare domain lands. Honours Arabic-only mode (no /ar prefix). */
const STOREFRONT_HOME =
  routing.localePrefix === 'never' ? '/store' : `/${routing.defaultLocale}/store`;

type HostKind = 'admin' | 'store' | 'both';

function requestHost(request: NextRequest): string {
  return (request.headers.get('host') ?? '').split(':')[0].toLowerCase();
}

function hostKind(host: string): HostKind {
  // Local dev, LAN IPs and tunnels: keep every route reachable from one origin,
  // otherwise `npm run dev` on localhost could never open the console.
  if (!host || !host.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return 'both';
  if (host.startsWith('admin.')) return 'admin';
  return 'store';
}

/** Storefront paths — the only ones next-intl should touch. */
function isStorefrontPath(pathname: string): boolean {
  if (pathname === '/store' || pathname.startsWith('/store/')) return true;
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = requestHost(request);

  if (hostKind(host) === 'store') {
    // The bare domain shows the store, and keeps showing `qutb.tech` in the
    // address bar — a rewrite, not a redirect.
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = STOREFRONT_HOME;
      return NextResponse.rewrite(url);
    }

    // Console routes reached on the public domain move to the console host,
    // preserving path and query so a bookmarked deep link still lands right.
    //
    // Built as a string on purpose: handing NextResponse.redirect a URL object
    // lets Next normalise it back to a same-host relative Location, which turns
    // this into a redirect loop instead of a hop to the console.
    if (ADMIN_SEGMENTS.has(pathname.split('/')[1] ?? '')) {
      const target = `https://admin.${host.replace(/^www\./, '')}${pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(target, 308);
    }
  }

  return isStorefrontPath(pathname) ? handleLocale(request) : NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
