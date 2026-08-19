import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Next.js 16: this file must be `proxy.ts` only — do not add `middleware.ts`.
 * Locale routing for the public storefront. ERP routes are excluded via matcher.
 */
const handleLocale = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  return handleLocale(request);
}

export const config = {
  matcher: [
    '/store',
    '/store/:path*',
    '/(ar|en)/store',
    '/(ar|en)/store/:path*',
  ],
};
