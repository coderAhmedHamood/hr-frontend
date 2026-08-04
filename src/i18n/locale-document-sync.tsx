'use client';

import { useLayoutEffect } from 'react';
import { isRtlLocale, type StorefrontLocale } from '@/i18n/routing';

/**
 * Syncs document lang/dir for locale routes on client navigations.
 * First paint is handled by LOCALE_DOCUMENT_BOOT_SCRIPT in the root layout —
 * do not render a <script> here (client components never execute inline scripts).
 */
export function LocaleDocumentSync({ locale }: { locale: StorefrontLocale }) {
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}
