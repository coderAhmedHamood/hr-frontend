import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Locale routing applies to the public storefront only.
 * ERP/admin routes (`/hr`, `/system`, `/products`, etc.) are excluded.
 */
export default createMiddleware(routing);

export const config = {
  matcher: [
    '/store',
    '/store/(.*)',
    '/(ar|en)/store',
    '/(ar|en)/store/(.*)',
  ],
};
