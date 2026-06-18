import { addDays, eachDayOfInterval, format, isValid, parseISO, startOfDay } from 'date-fns';
import type { AttendanceDaySummary, DaySummaryStatus } from './types';

export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseIsoDate(d: string): Date | null {
  const x = parseISO(d);
  return isValid(x) ? startOfDay(x) : null;
}

export function minutesFromMidnight(isoOrTime: string): number {
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime);
    if (!isValid(d)) return 0;
    return d.getHours() * 60 + d.getMinutes();
  }
  const [h, m] = isoOrTime.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutesAsTime(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function enumerateDates(from: string, to: string): string[] {
  const a = parseISO(from);
  const b = parseISO(to);
  if (!isValid(a) || !isValid(b) || a > b) return [];
  return eachDayOfInterval({ start: a, end: b }).map((d) => format(d, 'yyyy-MM-dd'));
}

/** Map legacy dashboard status to spec day summary status */
export function mapRecordStatusToSummary(
  status: string,
  checkIn: string | null,
  checkOut: string | null,
): DaySummaryStatus {
  if (status === 'on-leave') return 'incomplete';
  if (status === 'absent') return 'absent';
  if (status === 'late') return 'late';
  if (status === 'early-leave') return 'early_leave';
  if (checkIn && !checkOut) return 'incomplete';
  if (status === 'present') return 'present';
  return 'present';
}

export function buildSummariesFromTodayJson(
  rows: {
    id: string;
    employeeId: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    shiftId: string;
    geoPointId?: string;
  }[],
  employeeName: (id: string) => string,
): AttendanceDaySummary[] {
  return rows.map((r) => {
    let worked = 0;
    if (r.checkIn && r.checkOut) {
      worked = Math.max(0, minutesFromMidnight(r.checkOut) - minutesFromMidnight(r.checkIn));
    } else if (r.checkIn) {
      worked = Math.max(0, 17 * 60 - minutesFromMidnight(r.checkIn));
    }
    const st = mapRecordStatusToSummary(r.status, r.checkIn, r.checkOut);
    const notes = r.status === 'on-leave' ? 'في إجازة' : undefined;
    return {
      id: `sum-${r.id}`,
      employeeId: r.employeeId,
      employeeName: employeeName(r.employeeId),
      date: r.date,
      templateId: `tpl-${r.shiftId}`,
      status: st,
      lateMinutes: r.lateMinutes,
      earlyLeaveMinutes: r.earlyLeaveMinutes,
      overtimeMinutes: st === 'overtime' ? 30 : 0,
      workedMinutes: worked,
      notes,
    };
  });
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function addDaysIso(iso: string, n: number): string {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(addDays(d, n), 'yyyy-MM-dd');
}
