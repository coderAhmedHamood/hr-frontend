import type { StorefrontLocale } from '@/i18n/routing';

/** Bilingual CMS field — resolved at the repository boundary only. */
export type LocalizableString = {
  ar: string;
  en: string;
};

export function resolveLocalizedText(value: LocalizableString, locale: StorefrontLocale): string {
  return locale === 'en' ? value.en : value.ar;
}

export function resolveLocalizedOptional(
  value: LocalizableString | undefined,
  locale: StorefrontLocale,
): string | undefined {
  if (!value) return undefined;
  return resolveLocalizedText(value, locale);
}
