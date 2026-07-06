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
import { StickyPagination } from '@/components/ui/sticky-pagination';
import {
  PagedListViewport,
  PagedShell,
  useListPagination,
  type PaginationBarState,
} from '@/components/ui/paged-list';

type EmployeeRow = { id: string; name: string };

function filterByEmployees<T extends { employeeId: string }>(items: T[], pageEmployees: EmployeeRow[]) {
  const ids = new Set(pageEmployees.map((e) => e.id));
  return items.filter((item) => ids.has(item.employeeId));
}

// Renders the pagination bar as a `shrink-0` row INSIDE the same fixed-height,
// overflow-hidden box as the scrollable content (via `PagedShell`'s `footer`
// slot), instead of as a sibling rendered after it. That way flexbox — not a
// guessed pixel gap — reserves exactly the space the bar actually needs, and
// the whole block can never exceed the viewport height and leak into the
// outer app-shell scrollbar (the "two scrollbars" bug).
function paginationFooter(pagination: PaginationBarState) {
  if (pagination.total === 0) return undefined;
  return (
    <StickyPagination
      page={pagination.page}
      pageSize={pagination.pageSize}
      total={pagination.total}
      totalPages={pagination.totalPages}
      onPageChange={pagination.setPage}
      onPageSizeChange={pagination.setPageSize}
    />
  );
}

function renderTimelineView({
  days,
  pageEmployees,
  pageSummaries,
  pageEvents,
  dates,
  viewMode,
  className,
  pagination,
}: {
  days: number;
  pageEmployees: EmployeeRow[];
  pageSummaries: AttendanceDaySummary[];
  pageEvents: AttendanceEvent[];
  dates: string[];
  viewMode: AttendanceViewMode;
  className?: string;
  pagination: PaginationBarState;
}) {
  if (days === 1) {
    const footer = paginationFooter(pagination);
    return (
      <PagedListViewport className={className ?? 'min-h-0 flex-1'}>
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <DailyOneDayView
            className="min-h-0 flex-1"
            summaries={pageSummaries}
            initialEvents={pageEvents}
            workDate={dates[0]!}
            allEmployees={pageEmployees}
          />
          {footer ? <div className="shrink-0">{footer}</div> : null}
        </div>
      </PagedListViewport>
    );
  }

  const grid = days <= 3
    ? <DailyGanttTimeline summaries={pageSummaries} events={pageEvents} dates={dates} />
    : days <= 14
      ? <DailyWeekGrid summaries={pageSummaries} dates={dates} />
      : <DailyMonthHeatmap summaries={pageSummaries} dates={dates} viewMode={viewMode} />;

  return (
    <PagedListViewport className={className ?? 'min-h-0 flex-1'}>
      <PagedShell footer={paginationFooter(pagination)}>{grid}</PagedShell>
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
  serverPagination,
  loading = false,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
  viewMode: AttendanceViewMode;
  allEmployees: { id: string; name: string }[];
  className?: string;
  serverPagination?: PaginationBarState;
  loading?: boolean;
}) {
  const days = dates.length;
  const employeeRows = React.useMemo(() => {
    const m = new Map<string, string>();
    if (days === 1 && !serverPagination) {
      for (const emp of allEmployees) m.set(emp.id, emp.name);
    }
    for (const s of summaries) m.set(s.employeeId, s.employeeName);
    for (const e of events) {
      if (!m.has(e.employeeId)) {
        m.set(e.employeeId, e.employeeName ?? allEmployees.find((x) => x.id === e.employeeId)?.name ?? e.employeeId);
      }
    }
    return [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [summaries, events, allEmployees, days, serverPagination]);

  const clientResetDeps = React.useMemo(
    () => [summaries, events, dates.join('|'), viewMode, allEmployees.length],
    [summaries, events, dates, viewMode, allEmployees.length],
  );
  const clientPagination = useListPagination(employeeRows, clientResetDeps);

  if (days === 0) {
    return (
      <EmptyStateCard icon={Clock3} title="لا سجلات في النطاق المحدد" description="اختر نطاقاً زمنياً لعرض الجدول." />
    );
  }

  if (!loading && employeeRows.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  if (serverPagination) {
    if (loading && employeeRows.length === 0) {
      return <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>;
    }
    return renderTimelineView({
      days,
      pageEmployees: employeeRows,
      pageSummaries: filterByEmployees(summaries, employeeRows),
      pageEvents: filterByEmployees(events, employeeRows),
      dates,
      viewMode,
      className,
      pagination: serverPagination,
    });
  }

  const pageEmployees = clientPagination.pageItems;
  return renderTimelineView({
    days,
    pageEmployees,
    pageSummaries: filterByEmployees(summaries, pageEmployees),
    pageEvents: filterByEmployees(events, pageEmployees),
    dates,
    viewMode,
    className,
    pagination: {
      page: clientPagination.page,
      pageSize: clientPagination.pageSize,
      total: clientPagination.total,
      totalPages: clientPagination.totalPages,
      setPage: clientPagination.setPage,
      setPageSize: clientPagination.setPageSize,
    },
  });
}
