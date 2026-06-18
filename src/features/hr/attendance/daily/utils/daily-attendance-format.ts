import { format, parseISO, isFriday } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { toWesternDigits } from '@/shared/utils';

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
  return format(parseISO(`${iso}T12:00:00`), 'EEEE', { locale: arSA });
}

export function fmtDayShort(iso: string) {
  const dow = parseISO(`${iso}T12:00:00`).getDay();
  return DAY_NAMES_AR[dow] ?? '';
}

export function fmtDay(iso: string) {
  return toWesternDigits(format(parseISO(iso), 'd', { locale: arSA }));
}

export function fmtFull(iso: string) {
  return toWesternDigits(format(parseISO(`${iso}T12:00:00`), 'EEEE d MMMM yyyy', { locale: arSA }));
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
