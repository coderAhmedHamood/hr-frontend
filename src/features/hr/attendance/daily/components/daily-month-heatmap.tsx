'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary } from '@/features/hr/attendance/lib/types';
import { todayIso } from '@/features/hr/attendance/lib/utils';
import { cfgFor, resolveVisualKey } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { STATUS } from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { fmtDay, fmtFull, minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { Clock3, TrendingUp } from 'lucide-react';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { DAILY_ATTENDANCE_NO_RECORDS } from '@/features/hr/attendance/daily/constants/daily-attendance-empty';
import { DailyDayDetailDialog } from '@/features/hr/attendance/daily/components/daily-day-detail-dialog';
import type { AttendanceViewMode } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

// ─── Full Arabic day names (col 0=Sat … col 6=Fri) ───────────────────────────

const DAY_NAMES_FULL: Record<number, string> = {
  0: 'السبت',
  1: 'الأحد',
  2: 'الاثنين',
  3: 'الثلاثاء',
  4: 'الأربعاء',
  5: 'الخميس',
  6: 'الجمعة',
};

/** Returns column index where Saturday=0, Sunday=1, …, Friday=6 */
function getDayOfWeek(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return (d.getDay() + 1) % 7; // Sat=6→0, Sun=0→1, …, Fri=5→6
}

// ─── per-employee summary row ─────────────────────────────────────────────────

type EmpRow = {
  id: string;
  name: string;
  byDate: Map<string, AttendanceDaySummary>;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  earlyDays: number;
  restDays: number;
  leaveDays: number;
  workedMinutes: number;
  lateMinutes: number;
  attendanceRate: number;
};

function buildRows(summaries: AttendanceDaySummary[], dates: string[]): EmpRow[] {
  const m = new Map<string, EmpRow>();

  for (const s of summaries) {
    if (!m.has(s.employeeId)) {
      m.set(s.employeeId, {
        id: s.employeeId,
        name: s.employeeName,
        byDate: new Map(),
        presentDays: 0, lateDays: 0, absentDays: 0, earlyDays: 0, restDays: 0, leaveDays: 0,
        workedMinutes: 0, lateMinutes: 0, attendanceRate: 0,
      });
    }
    const row = m.get(s.employeeId)!;
    row.byDate.set(s.date, s);
    const vk = resolveVisualKey(s.status);
    if (vk === 'present') row.presentDays++;
    else if (vk === 'late') { row.lateDays++; row.lateMinutes += s.lateMinutes; }
    else if (vk === 'absent') row.absentDays++;
    else if (vk === 'early_leave') row.earlyDays++;
    else if (vk === 'rest_day' || vk === 'holiday' || vk === 'unscheduled') row.restDays++;
    else if (vk === 'on_leave') row.leaveDays++;
    row.workedMinutes += s.workedMinutes;
  }

  const workingDays = dates.length;
  for (const row of m.values()) {
    const attended = row.presentDays + row.lateDays + row.earlyDays;
    const denominator = workingDays - row.restDays - row.leaveDays;
    row.attendanceRate = denominator > 0 ? Math.round((attended / denominator) * 100) : 100;
  }

  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

// ─── attendance rate ring ─────────────────────────────────────────────────────

function RateRing({ rate }: { rate: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  const color = rate >= 90 ? '#22c55e' : rate >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="18" y="18" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90 fill-foreground"
        style={{ fontSize: 8, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}>
        {rate}%
      </text>
    </svg>
  );
}

// ─── stat chip ────────────────────────────────────────────────────────────────

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums', color)}>
      {value} {label}
    </span>
  );
}

// ─── day cell ─────────────────────────────────────────────────────────────────

function DayCell({
  date,
  summary,
  onDayClick,
}: {
  date: string;
  summary: AttendanceDaySummary | undefined;
  onDayClick?: (s: AttendanceDaySummary, date: string) => void;
}) {
  const today = date === todayIso();
  const dayNum = fmtDay(date);

  if (!summary) {
    return (
      <div
        title={date}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-medium transition-colors',
          today ? 'ring-2 ring-primary ring-offset-1' : '',
          'bg-muted/20 text-muted-foreground/30',
        )}
      >
        {dayNum}
      </div>
    );
  }

  const cfg = cfgFor(summary.status);
  const tip = [
    fmtFull(date),
    cfg.label,
    summary.lateMinutes > 0 ? `تأخير ${minutesToHHMM(summary.lateMinutes)}` : null,
    summary.workedMinutes > 0 ? `عمل ${minutesToHHMM(summary.workedMinutes)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      title={tip}
      onClick={() => onDayClick?.(summary, date)}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-semibold transition-all hover:scale-110 hover:shadow-md cursor-pointer',
        cfg.color,
        today ? 'ring-2 ring-primary ring-offset-1' : '',
      )}
    >
      {dayNum}
      {summary.lateMinutes > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-warning" />
      )}
    </button>
  );
}

// ─── employee card ────────────────────────────────────────────────────────────

function EmployeeCard({
  row,
  dates,
  onDayClick,
}: {
  row: EmpRow;
  dates: string[];
  onDayClick: (s: AttendanceDaySummary, date: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  // Build calendar: group dates by week (7 columns), preserving day-of-week alignment for first week
  const calendarWeeks = React.useMemo(() => {
    if (dates.length === 0) return [];
    const firstDow = getDayOfWeek(dates[0]);
    const weeks: (string | null)[][] = [];
    let current: (string | null)[] = Array.from({ length: firstDow }, () => null);
    for (const d of dates) {
      current.push(d);
      if (current.length === 7) { weeks.push(current); current = []; }
    }
    if (current.length > 0) {
      while (current.length < 7) current.push(null);
      weeks.push(current);
    }
    return weeks;
  }, [dates]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-right hover:bg-muted/20 transition-colors"
      >
        {/* Avatar */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
          style={{ background: `hsl(${(row.name.charCodeAt(0) * 37) % 360} 55% 45%)` }}
        >
          {row.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>

        {/* Name + chips */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{row.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Chip label="حاضر"   value={row.presentDays} color={STATUS.present.color} />
            <Chip label="متأخر"  value={row.lateDays}    color={STATUS.late.color} />
            <Chip label="غائب"   value={row.absentDays}  color={STATUS.absent.color} />
            <Chip label="مبكر"   value={row.earlyDays}   color={STATUS.early_leave.color} />
            <Chip label="إجازة"  value={row.leaveDays}   color={STATUS.on_leave.color} />
            <Chip label="راحة"   value={row.restDays}    color={STATUS.rest_day.color} />
          </div>
        </div>

        {/* Rate ring */}
        <RateRing rate={row.attendanceRate} />

        {/* Hours */}
        <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[56px]">
          <span className="text-xs font-bold tabular-nums text-foreground">
            {minutesToHHMM(row.workedMinutes)}
            <span className="text-[10px] font-normal text-muted-foreground ms-0.5">س</span>
          </span>
          {row.lateMinutes > 0 && (
            <span className="text-[10px] tabular-nums text-warning">
              +{minutesToHHMM(row.lateMinutes)} تأخير
            </span>
          )}
        </div>

        <span className={cn('ms-1 text-muted-foreground/40 transition-transform text-xs shrink-0', expanded ? 'rotate-180' : '')}>▼</span>
      </button>

      {/* Calendar grid — expanded */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/10 px-4 py-4 space-y-2">
          {/* Day-of-week header with full Arabic names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
              <div key={dow} className="flex h-6 items-start justify-start text-[9px] font-semibold text-muted-foreground truncate px-0.5">
                {DAY_NAMES_FULL[dow]}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {calendarWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((date, di) => {
                if (!date) return <div key={di} className="h-8 w-8" />;
                return (
                  <DayCell
                    key={date}
                    date={date}
                    summary={row.byDate.get(date)}
                    onDayClick={onDayClick}
                  />
                );
              })}
            </div>
          ))}

          {/* Footer stats */}
          <div className="flex flex-wrap gap-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              إجمالي العمل: <strong className="text-foreground ms-0.5 tabular-nums">{minutesToHHMM(row.workedMinutes)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              نسبة الحضور: <strong className="text-foreground ms-0.5 tabular-nums">{row.attendanceRate}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Table view ───────────────────────────────────────────────────────────────

function TableView({
  rows,
  onDayClick,
}: {
  rows: EmpRow[];
  onDayClick: (s: AttendanceDaySummary, date: string) => void;
}) {
  // Flatten all summaries sorted by date then employee
  const allRecords = React.useMemo(() => {
    const flat: { row: EmpRow; date: string; summary: AttendanceDaySummary }[] = [];
    for (const row of rows) {
      for (const [date, summary] of row.byDate.entries()) {
        flat.push({ row, date, summary });
      }
    }
    return flat.sort((a, b) => b.date.localeCompare(a.date) || a.row.name.localeCompare(b.row.name, 'ar'));
  }, [rows]);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-right">
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">الموظف</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">التاريخ</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">اليوم</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">الحالة</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">وقت الحضور</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">وقت الانصراف</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">مدة العمل</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">التأخير</th>
          </tr>
        </thead>
        <tbody>
          {allRecords.map(({ row, date, summary }) => {
            const vk = resolveVisualKey(summary.status);
            const cfg = STATUS[vk];
            const checkIn = summary.actualCheckInAt ? (() => {
              try { return new Date(summary.actualCheckInAt!).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return null; }
            })() : null;
            const checkOut = summary.actualCheckOutAt ? (() => {
              try { return new Date(summary.actualCheckOutAt!).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return null; }
            })() : null;
            const dow = DAY_NAMES_FULL[getDayOfWeek(date)];
            return (
              <tr
                key={`${row.id}|${date}`}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onDayClick(summary, date)}
              >
                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{date}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{dow}</td>
                <td className="px-4 py-2.5">
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', cfg.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-success">{checkIn ?? '—'}</td>
                <td className="px-4 py-2.5 tabular-nums text-blue-600 dark:text-blue-400">{checkOut ?? '—'}</td>
                <td className="px-4 py-2.5 tabular-nums">{summary.workedMinutes > 0 ? minutesToHHMM(summary.workedMinutes) : '—'}</td>
                <td className="px-4 py-2.5 tabular-nums">
                  {summary.lateMinutes > 0 ? (
                    <span className="text-warning font-semibold">{minutesToHHMM(summary.lateMinutes)}</span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {allRecords.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد سجلات</div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Object.entries(STATUS).map(([key, cfg]) => (
        <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DailyMonthHeatmap({
  summaries,
  dates,
  viewMode,
}: {
  summaries: AttendanceDaySummary[];
  dates: string[];
  viewMode: AttendanceViewMode;
}) {
  const rows = React.useMemo(() => buildRows(summaries, dates), [summaries, dates]);
  const [detailSummary, setDetailSummary] = React.useState<AttendanceDaySummary | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const companyId = useDefaultCompanyId() ?? '';

  const handleDayClick = React.useCallback((s: AttendanceDaySummary, _date: string) => {
    setDetailSummary(s);
    setDetailOpen(true);
  }, []);

  if (rows.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  return (
    <div className="space-y-4">
      {/* Day detail dialog */}
      <DailyDayDetailDialog
        summary={detailSummary}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        companyId={companyId}
      />

      {/* Legend + count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{rows.length}</span> موظف ·{' '}
          <span className="tabular-nums">{dates.length}</span> يوم
          {viewMode === 'card' && ' · انقر على يوم لعرض التفاصيل'}
        </p>
        <Legend />
      </div>

      {/* Card view */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <EmployeeCard key={row.id} row={row} dates={dates} onDayClick={handleDayClick} />
          ))}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <TableView rows={rows} onDayClick={handleDayClick} />
      )}
    </div>
  );
}
