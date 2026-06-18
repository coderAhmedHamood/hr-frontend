import type { DocumentLocale, LocalizedText, RoseDocumentLanguage } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export function localized(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export function pickLocalized(
  text: LocalizedText | undefined | null,
  locale: DocumentLocale,
): string {
  if (!text) return '';
  const primary = locale === 'en' ? text.en : text.ar;
  const fallback = locale === 'en' ? text.ar : text.en;
  return (primary || fallback || '').trim();
}

export function resolveActiveLocales(language: RoseDocumentLanguage): DocumentLocale[] {
  if (language === 'ar') return ['ar'];
  if (language === 'en') return ['en'];
  return ['ar', 'en'];
}

export const LOCALE_META: Record<
  DocumentLocale,
  { dir: 'rtl' | 'ltr'; lang: DocumentLocale; textAlign: 'right' | 'left' }
> = {
  ar: { dir: 'rtl', lang: 'ar', textAlign: 'right' },
  en: { dir: 'ltr', lang: 'en', textAlign: 'left' },
};

export function documentRootLocale(language: RoseDocumentLanguage): DocumentLocale {
  return language === 'en' ? 'en' : 'ar';
}
