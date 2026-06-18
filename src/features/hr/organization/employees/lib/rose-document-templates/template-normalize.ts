import { localized } from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import type { LocalizedText } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export function readLocalizedPair(
  raw: Record<string, unknown>,
  pairKey: string,
  arKey: string,
  enKey: string,
  fallback: LocalizedText,
): LocalizedText {
  const pair = raw[pairKey];
  if (pair && typeof pair === 'object' && ('ar' in pair || 'en' in pair)) {
    const typed = pair as Partial<LocalizedText>;
    return localized(
      String(typed.ar ?? fallback.ar),
      String(typed.en ?? fallback.en),
    );
  }
  const ar = raw[arKey];
  const en = raw[enKey];
  if (typeof ar === 'string' || typeof en === 'string') {
    return localized(
      typeof ar === 'string' ? ar : fallback.ar,
      typeof en === 'string' ? en : fallback.en,
    );
  }
  return fallback;
}
