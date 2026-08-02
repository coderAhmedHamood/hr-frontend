import { NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { LOCALE_COOKIE_NAME } from '@/i18n/config';

/**
 * Sets the admin app's locale Cookie. The storefront never calls this — it
 * switches locale by navigating to the equivalent `[locale]`-prefixed path
 * instead (see the Frontend Engineering Contract's Locale Routing matrix).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { locale?: string } | null;
  const locale = body?.locale;

  if (!locale || !hasLocale(routing.locales, locale)) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}
