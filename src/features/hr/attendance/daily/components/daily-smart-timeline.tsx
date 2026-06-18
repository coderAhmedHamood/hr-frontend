'use client';

import * as React from 'react';
import type { AttendanceDaySummary, AttendanceEvent } from '@/features/hr/attendance/lib/types';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { Clock3 } from 'lucide-react';
import { DailyOneDayView } from '@/features/hr/attendance/daily/components/daily-one-day-view';
import { DailyGanttTimeline } from '@/features/hr/attendance/daily/components/daily-gantt-timeline';
import { DailyWeekGrid } from '@/features/hr/attendance/daily/components/daily-week-grid';
import { DailyMonthHeatmap } from '@/features/hr/attendance/daily/components/daily-month-heatmap';
import type { AttendanceViewMode } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';
import { DAILY_ATTENDANCE_NO_RECORDS } from '@/features/hr/attendance/daily/constants/daily-attendance-empty';
import { PagedListViewport, PagedShell } from '@/components/ui/paged-list';

function DailyTimelineScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <PagedListViewport className={className ?? 'min-h-0 flex-1'}>
      <PagedShell>{children}</PagedShell>
    </PagedListViewport>
  );
}

export function DailySmartTimeline({
  summaries,
  events,
  dates,
  viewMode,
  allEmployees,
  className,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
  viewMode: AttendanceViewMode;
  allEmployees: { id: string; name: string }[];
  className?: string;
}) {
  const days = dates.length;
  const employeeRows = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of summaries) m.set(s.employeeId, s.employeeName);
    for (const e of events) {
      if (!m.has(e.employeeId)) {
        m.set(e.employeeId, e.employeeName ?? allEmployees.find((x) => x.id === e.employeeId)?.name ?? e.employeeId);
      }
    }
    return [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [summaries, events, allEmployees]);

  if (days === 0) {
    return (
      <EmptyStateCard icon={Clock3} title="لا سجلات في النطاق المحدد" description="اختر نطاقاً زمنياً لعرض الجدول." />
    );
  }

  if (employeeRows.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  const employeeIds = new Set(employeeRows.map((e) => e.id));
  const pageSummaries = summaries.filter((s) => employeeIds.has(s.employeeId));
  const pageEvents = events.filter((e) => employeeIds.has(e.employeeId));
  const pageAllEmployees = allEmployees.filter((e) => employeeIds.has(e.id));

  if (days === 1) {
    return (
      <DailyTimelineScroll className={className}>
        <DailyOneDayView
          summaries={pageSummaries}
          initialEvents={pageEvents}
          workDate={dates[0]!}
          allEmployees={pageAllEmployees}
        />
      </DailyTimelineScroll>
    );
  }

  if (days <= 3) {
    return (
      <DailyTimelineScroll className={className}>
        <DailyGanttTimeline summaries={pageSummaries} events={pageEvents} dates={dates} />
      </DailyTimelineScroll>
    );
  }

  if (days <= 14) {
    return (
      <DailyTimelineScroll className={className}>
        <DailyWeekGrid summaries={pageSummaries} dates={dates} />
      </DailyTimelineScroll>
    );
  }

  return (
    <DailyTimelineScroll className={className}>
      <DailyMonthHeatmap summaries={pageSummaries} dates={dates} viewMode={viewMode} />
    </DailyTimelineScroll>
  );
}
