/** تصفية السجلات بتاريخ YYYY-MM-DD (إنذارات، تحقيقات، تظلمات، مخالفات، …) */

export type DateFilterTab = 'all' | 'today' | 'week' | 'month' | 'custom';

export const DEFAULT_DATE_FILTER_TAB: DateFilterTab = 'all';

export const DEFAULT_DATE_FILTER_META = {
  tab: DEFAULT_DATE_FILTER_TAB,
  hasRestriction: false,
} as const;

export function recordDateComparable(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
}

export function dateToYMD(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function todayYMD(): string {
  return dateToYMD(new Date());
}

/** من السبت إلى الجمعة (التقويم المحلي) */
export function thisWeekSunSatYMD(): { from: string; to: string } {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = day.getDay(); // 0=Sun … 6=Sat
  // How many days since last Saturday: Sat=0, Sun=1, Mon=2, …, Fri=6
  const daysSinceSat = (dow + 1) % 7;
  const sat = new Date(day);
  sat.setDate(day.getDate() - daysSinceSat);
  const fri = new Date(sat);
  fri.setDate(sat.getDate() + 6);
  return { from: dateToYMD(sat), to: dateToYMD(fri) };
}

/** أول وآخر يوم من الشهر الحالي (التقويم المحلي) */
export function thisCalendarMonthYMD(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: dateToYMD(first), to: dateToYMD(last) };
}

export function hasDateRangeFilter(fromStr: string, toStr: string): boolean {
  return Boolean(fromStr.trim() || toStr.trim());
}

export const EMPTY_PERIOD_RANGE = { from: '', to: '' } as const;

/** Whether the current period differs from the page default (for «مسح الكل»). */
export function isPeriodFilterActive(
  current: { from: string; to: string },
  defaults: { from: string; to: string } = EMPTY_PERIOD_RANGE,
): boolean {
  return current.from !== defaults.from || current.to !== defaults.to;
}

/** Normalize picker output to a closed YMD interval (single-day when `to` omitted). */
export function normalizePeriodRange(range: { from: string; to: string }): { from: string; to: string } | null {
  const from = range.from?.trim() ?? '';
  let to = range.to?.trim() ?? '';
  if (!from) return null;
  if (!to) to = from;
  if (from > to) return { from: to, to: from };
  return { from, to };
}

export function comparableRangeBounds(fromStr: string, toStr: string): { lo: number | null; hi: number | null } {
  let lo = fromStr.trim() ? recordDateComparable(fromStr) : null;
  let hi = toStr.trim() ? recordDateComparable(toStr) : null;
  if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];
  return { lo, hi };
}

export function matchesDateRange(dateStr: string, fromStr: string, toStr: string): boolean {
  if (!hasDateRangeFilter(fromStr, toStr)) return true;
  const cd = recordDateComparable(dateStr);
  if (cd == null) return false;
  const { lo, hi } = comparableRangeBounds(fromStr, toStr);
  if (lo != null && cd < lo) return false;
  if (hi != null && cd > hi) return false;
  return true;
}

/** Whether a closed interval [startYmd, endYmd] intersects the filter range (inclusive). */
export function intervalOverlapsYmdRange(startYmd: string, endYmd: string, fromStr: string, toStr: string): boolean {
  if (!hasDateRangeFilter(fromStr, toStr)) return true;
  const { lo, hi } = comparableRangeBounds(fromStr, toStr);
  const ls = recordDateComparable(startYmd);
  const le = recordDateComparable(endYmd);
  if (ls == null || le == null) return false;
  if (lo != null && le < lo) return false;
  if (hi != null && ls > hi) return false;
  return true;
}

export function ymdToMDYDisplay(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return '';
  return `${m[2]}/${m[3]}/${m[1]}`;
}

export function parseMDYToYMD(text: string): '' | null | string {
  const t = text.trim();
  if (!t) return '';
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return dateToYMD(d);
}

export function effectiveDateRange(tab: DateFilterTab, customFrom: string, customTo: string): { from: string; to: string } {
  switch (tab) {
    case 'all':
      return { from: '', to: '' };
    case 'today': {
      const t = todayYMD();
      return { from: t, to: t };
    }
    case 'week':
      return thisWeekSunSatYMD();
    case 'month':
      return thisCalendarMonthYMD();
    case 'custom':
      return { from: customFrom.trim(), to: customTo.trim() };
    default:
      return { from: '', to: '' };
  }
}

export function dateFilterHasRestriction(tab: DateFilterTab, customFrom: string, customTo: string): boolean {
  const { from, to } = effectiveDateRange(tab, customFrom, customTo);
  return hasDateRangeFilter(from, to);
}

export function defaultDateFilterBounds(): { from: string; to: string } {
  return effectiveDateRange(DEFAULT_DATE_FILTER_TAB, '', '');
}
