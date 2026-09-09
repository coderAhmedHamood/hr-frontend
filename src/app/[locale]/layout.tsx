import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { LocaleDocumentSync } from '@/i18n/locale-document-sync';
import { routing, type StorefrontLocale } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Only `ar` / `en` may occupy `[locale]`. Without this, Next treats the first
 * URL segment as a locale (`system-owner`, `inventory`, …) and 404s nested
 * ERP pages such as `/system-owner/companies/:id`.
 */
export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleDocumentSync locale={locale as StorefrontLocale} />
      {children}
    </NextIntlClientProvider>
  );
}
