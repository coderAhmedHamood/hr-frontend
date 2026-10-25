/** Plain-text formatters for list exports (PDF / Excel) of requests & leaves screens. */

import { companyCurrencyCode } from '@/features/auth/lib/company-currency';
import { formatNumber } from '@/shared/utils';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `YYYY-MM-DD`, or `—` when empty. Date-only strings are kept as is (no timezone shift). */
export function exportDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return typeof value === 'string' ? value : '—';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Clock time as the UI shows it: `h:mm ص|م` (accepts `HH:mm` or an ISO timestamp). */
export function exportClock(value: string | null | undefined): string {
  if (!value) return '—';
  let h24: number;
  let minutes: string;
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(':');
    h24 = parseInt(h ?? '0', 10);
    minutes = (m ?? '00').padStart(2, '0');
  } else {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    h24 = d.getHours();
    minutes = pad2(d.getMinutes());
  }
  return `${h24 % 12 || 12}:${minutes} ${h24 < 12 ? 'ص' : 'م'}`;
}

/** `YYYY-MM-DD h:mm ص|م`, or `—` when empty. */
export function exportDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  return `${exportDate(d)} ${exportClock(d.toISOString())}`;
}

/** Empty / whitespace → `—`. */
export function exportText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const s = String(value).trim();
  return s ? s : '—';
}

/** Duration as `DurationMinutesDisplay` shows it: `2س 15د`, `45د`, or `—`. */
export function exportDuration(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}س`);
  if (m > 0 || h <= 0) parts.push(`${m}د`);
  return parts.join(' ');
}

/** Amount with its currency code, digits as the UI shows them (`formatNumber`): `1,500 SAR`. */
export function exportMoney(value: number | null | undefined, currency?: string | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${formatNumber(value)} ${currency?.trim().toUpperCase() || companyCurrencyCode()}`;
}
