import { accounting } from '@/shared/i18n/accounting';

const AR = { accounting } as const;

export function getTranslations() {
  return AR;
}

export type Translations = typeof AR;
