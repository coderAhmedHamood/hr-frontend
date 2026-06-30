import { parseISO, isFriday } from 'date-fns';
import { formatDisplayDate } from '@/shared/utils';

const DAY_NAMES_AR: Record<number, string> = {
  0: 'الاثنين',
  1: 'الثلاثاء',
  2: 'الأربعاء',
  3: 'الخميس',
  4: 'الجمعة',
  5: 'السبت',
  6: 'الأحد',
};

export function fmtDayFull(iso: string) {
  const dow = parseISO(`${iso}T12:00:00`).getDay();
  return DAY_NAMES_AR[dow] ?? '';
}

export function fmtDayShort(iso: string) {
  const dow = parseISO(`${iso}T12:00:00`).getDay();
  return DAY_NAMES_AR[dow] ?? '';
}

export function fmtDay(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return String(Number(match[3]));
  return formatDisplayDate(iso);
}

export function fmtFull(iso: string) {
  return formatDisplayDate(iso);
}

export function minutesToHHMM(m: number) {
  const h = Math.floor(m / 60) % 24;
  const mn = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
}

export function fmtDecimalHours(hours: number): string {
  if (!Number.isFinite(hours) || hours === 0) return '0';
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export { isFriday };
