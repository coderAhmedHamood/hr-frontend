import { formatDisplayDate } from '@/shared/utils';

const FALLBACK = '—';

/** App-wide document date: `yyyy/mm/dd` (Gregorian). */
export function formatHijriDate(iso: string): string {
  return formatDisplayDate(iso) || FALLBACK;
}

export function formatGregorianDateAr(iso: string): string {
  return formatDisplayDate(iso) || FALLBACK;
}

export function formatGregorianDateEn(iso: string): string {
  return formatDisplayDate(iso) || FALLBACK;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
