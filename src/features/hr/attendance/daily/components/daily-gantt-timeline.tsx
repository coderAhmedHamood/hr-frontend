'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary, AttendanceEvent } from '@/features/hr/attendance/lib/types';
import { minutesFromMidnight, todayIso } from '@/features/hr/attendance/lib/utils';
import { cfgFor } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { fmtDayFull, minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { Clock3 } from 'lucide-react';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { DAILY_ATTENDANCE_NO_RECORDS } from '@/features/hr/attendance/daily/constants/daily-attendance-empty';
import { DailyAttendanceLegend } from '@/features/hr/attendance/daily/components/daily-attendance-legend';

const HOUR_LABELS = [0, 4, 8, 12, 16, 20, 24];

export function DailyGanttTimeline({
  summaries,
  events,
  dates,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
}) {
  const eventMap = React.useMemo(() => {
    const m = new Map<string, AttendanceEvent[]>();
    for (const e of events) {
      const k = `${e.employeeId}|${e.date}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [events]);

  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; rows: AttendanceDaySummary[] }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, rows: [] });
      m.get(s.employeeId)!.rows.push(s);
    }
    return [...m.values()];
  }, [summaries]);

  if (byEmployee.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex gap-2">
          {dates.map((d) => (
            <div
              key={d}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-center',
                d === todayIso() ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30',
              )}
            >
              <p className="text-xs font-semibold text-foreground">{fmtDayFull(d)}</p>
              <p
                className={cn(
                  'text-[10px] tabular-nums',
                  d === todayIso() ? 'font-bold text-primary' : 'text-muted-foreground',
                )}
              >
                {d}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-border bg-muted/20 px-4 py-1.5" dir="ltr">
        <div className="flex items-center" style={{ paddingInlineEnd: '10rem' }}>
          {HOUR_LABELS.map((h) => (
            <div
              key={h}
              className="flex-1 text-center font-mono text-[9px] text-muted-foreground first:text-right last:text-left"
            >
              {String(h).padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {byEmployee.map(({ name, rows }) =>
          rows.map((s) => {
            const evs = eventMap.get(`${s.employeeId}|${s.date}`) ?? [];
            const sorted = [...evs].sort((a, b) => a.at.localeCompare(b.at));
            const checkIn = sorted.find((e) => e.type === 'check_in');
            const checkOut = sorted.findLast((e) => e.type === 'check_out');
            const inMins = checkIn ? minutesFromMidnight(checkIn.at) : null;
            const outMins = checkOut ? minutesFromMidnight(checkOut.at) : null;
            const cfg = cfgFor(s.status);
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/10">
                <div className="flex w-40 shrink-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDayFull(s.date)}</p>
                  </div>
                </div>
                <div className="relative flex-1" dir="ltr">
                  <div className="relative h-8 overflow-hidden rounded-lg bg-muted/40">
                    {[4, 8, 12, 16, 20].map((h) => (
                      <div
                        key={h}
                        className="absolute top-0 h-full w-px bg-border/40"
                        style={{ left: `${(h / 24) * 100}%` }}
                      />
                    ))}
                    {inMins !== null && (
                      <div
                        className={cn('absolute top-1 h-6 rounded-md opacity-80', cfg.bar)}
                        style={{
                          left: `${(inMins / (24 * 60)) * 100}%`,
                          width: outMins !== null ? `${((outMins - inMins) / (24 * 60)) * 100}%` : '1.5%',
                        }}
                      />
                    )}
                    {sorted
                      .filter((e) => e != null && e.id)
                      .map((e) => {
                        const mins = minutesFromMidnight(e.at);
                        return (
                          <div
                            key={e.id}
                            title={`${e.type === 'check_in' ? 'دخول' : 'خروج'} ${e.at}`}
                            className={cn(
                              'absolute top-1 h-6 w-1.5 rounded-sm shadow-sm',
                              e.type === 'check_in' ? 'bg-success' : 'bg-primary',
                            )}
                            style={{ left: `${(mins / (24 * 60)) * 100}%`, transform: 'translateX(-50%)' }}
                          />
                        );
                      })}
                  </div>
                </div>
                <div className="flex w-36 shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      cfg.color,
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                    {cfg.label}
                  </span>
                  {checkIn && (
                    <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                      {checkIn.at}
                      {checkOut ? ` → ${checkOut.at}` : ' →'}
                    </span>
                  )}
                  {s.workedMinutes > 0 && (
                    <span className="text-[10px] text-muted-foreground">{minutesToHHMM(s.workedMinutes)} عمل</span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>

      <DailyAttendanceLegend />
    </div>
  );
}
