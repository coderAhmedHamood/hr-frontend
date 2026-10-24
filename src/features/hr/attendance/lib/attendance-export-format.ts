import { getDisplayDateTimeParts } from '@/shared/utils';

/** Export cell for a date: `YYYY-MM-DD` (or «—»). */
export function exportDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  if (typeof value === 'string') {
    const ymd = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (ymd) return ymd[1];
  }
  const parts = getDisplayDateTimeParts(value);
  return parts ? parts.date.replace(/\//g, '-') : '—';
}

/** Export cell for a date-time as the tables show it: `YYYY-MM-DD 9:30ص` (or «—»). */
export function exportDateTime(value: string | Date | null | undefined): string {
  const parts = getDisplayDateTimeParts(value);
  if (!parts) return '—';
  return `${parts.date.replace(/\//g, '-')} ${parts.hours}:${parts.minutes}${parts.period}`;
}
