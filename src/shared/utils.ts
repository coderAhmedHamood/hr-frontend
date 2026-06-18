import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** UUID v4 — works on HTTP (non-secure) contexts where crypto.randomUUID is unavailable. */
export function randomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Arabic-Indic (٠–٩) and Persian (۰–۹) → Western ASCII digits (0–9). */
export function toWesternDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (ch) => {
    const code = ch.codePointAt(0)!;
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
    return ch;
  });
}

const LATN: Pick<Intl.NumberFormatOptions, 'numberingSystem'> = { numberingSystem: 'latn' };

export function formatCurrency(value: number): string {
  const n = Math.round(value);
  const s = new Intl.NumberFormat('en-US', {
    ...LATN,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  return `${s} ر.س`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    ...LATN,
    maximumFractionDigits: 20,
  }).format(value);
}

/** App-wide date display: `2026/05/22` */
export function formatDisplayDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  if (typeof date === 'string') {
    const ymd = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return `${ymd[1]}/${ymd[2]}/${ymd[3]}`;
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/** Isolate Arabic period + digits so ص/م always appear before hours:minutes in RTL UI. */
const LRI = '\u2066';
const PDI = '\u2069';

function formatArabicTime(hours24: number, hours12: number, minutes: string): string {
  const period = hours24 < 12 ? 'ص' : 'م';
  return `${LRI}${period}${hours12}:${minutes}${PDI}`;
}

/** App-wide datetime display: `2026/05/22-ص9:30` (RTL: time on the left, ص/م before hours) */
export function formatDisplayDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}-${formatArabicTime(hours24, hours12, minutes)}`;
}

/** Parsed parts for structured datetime rendering (avoids bidi reordering in RTL). */
export function getDisplayDateTimeParts(
  date: string | Date | null | undefined,
): { date: string; period: 'ص' | 'م'; hours: number; minutes: string } | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  const hours24 = d.getHours();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return {
    date: `${y}/${m}/${day}`,
    period: hours24 < 12 ? 'ص' : 'م',
    hours: hours24 % 12 || 12,
    minutes: String(d.getMinutes()).padStart(2, '0'),
  };
}

/** @deprecated Use formatDisplayDate */
export const formatTableDate = formatDisplayDate;
/** @deprecated Use formatDisplayDateTime */
export const formatTableDateTime = formatDisplayDateTime;

export function formatDate(date: string | Date | null | undefined): string {
  return formatDisplayDate(date);
}

export function formatDateShort(date: string | Date | null | undefined): string {
  return formatDisplayDate(date);
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return formatArabicTime(hours24, hours12, minutes);
}

/** Alias for formatDisplayDateTime — use for ISO timestamps (createdAt, submittedAt, …). */
export const formatDateTime = formatDisplayDateTime;

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return formatDate(d);
}
