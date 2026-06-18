'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary } from '@/features/hr/attendance/lib/types';
import { todayIso } from '@/features/hr/attendance/lib/utils';
import { cfgFor } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { fmtDay, fmtDayFull } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { Clock3 } from 'lucide-react';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { DAILY_ATTENDANCE_NO_RECORDS } from '@/features/hr/attendance/daily/constants/daily-attendance-empty';
import { DailyAttendanceLegend } from '@/features/hr/attendance/daily/components/daily-attendance-legend';
import { DailyDayDetailDialog } from '@/features/hr/attendance/daily/components/daily-day-detail-dialog';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

export function DailyWeekGrid({ summaries, dates }: { summaries: AttendanceDaySummary[]; dates: string[] }) {
  const companyId = useDefaultCompanyId() ?? '';
  const [detailSummary, setDetailSummary] = React.useState<AttendanceDaySummary | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; byDate: Map<string, AttendanceDaySummary> }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, byDate: new Map() });
      m.get(s.employeeId)!.byDate.set(s.date, s);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [summaries]);

  if (byEmployee.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  return (
    <>
      <DailyDayDetailDialog
        summary={detailSummary}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        companyId={companyId}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="sticky right-0 z-10 bg-muted/40 px-5 py-4 text-right">الموظف</th>
                {dates.map((d) => (
                  <th key={d} className="min-w-[100px] px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-semibold text-muted-foreground">{fmtDayFull(d)}</span>
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                          d === todayIso() ? 'bg-primary text-primary-foreground' : 'text-foreground',
                        )}
                      >
                        {fmtDay(d)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byEmployee.map(({ name, byDate }, idx) => (
                <tr key={idx} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/20">
                  <td className="sticky right-0 z-10 bg-card px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {name.charAt(0)}
                      </div>
                      <span className="whitespace-nowrap text-sm font-medium">{name}</span>
                    </div>
                  </td>
                  {dates.map((d) => {
                    const s = byDate.get(d);
                    if (!s) {
                      return (
                        <td key={d} className="px-3 py-3.5">
                          <div className="mx-auto h-10 w-20 rounded-lg bg-muted/30" />
                        </td>
                      );
                    }
                    const cfg = cfgFor(s.status);
                    return (
                      <td key={d} className="px-3 py-3.5">
                        <button
                          type="button"
                          title={`${name} · ${fmtDayFull(d)} · ${cfg.label} — انقر للتفاصيل أو التسجيل`}
                          onClick={() => { setDetailSummary(s); setDetailOpen(true); }}
                          className={cn(
                            'group mx-auto flex w-20 cursor-pointer flex-col items-center justify-center rounded-lg border px-1 py-2 transition-all hover:scale-105 hover:shadow-md hover:ring-1 hover:ring-primary/30',
                            cfg.color,
                          )}
                        >
                          <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                          <span className="mt-1 text-[10px] font-semibold leading-none">{cfg.label}</span>
                          {s.lateMinutes > 0 && (
                            <span className="mt-0.5 font-mono text-[9px] opacity-70">+{s.lateMinutes}د</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DailyAttendanceLegend />
      </div>
    </>
  );
}
