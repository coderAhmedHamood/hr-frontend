'use client';

import * as React from 'react';
import { Calendar, Clock, Coffee, MapPin } from 'lucide-react';
import { formatDate } from '@/shared/utils';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfilePagedList } from '@/features/hr/organization/employees/components/employee-profile-paged-list';
import type { AttendanceEventResponseDto } from '@/features/hr/attendance/lib/api/attendance-events';
import {
  ATTENDANCE_SOURCE_LABEL,
  AttendancePunchPair,
  durationBetweenIso,
  formatIsoTimeAr,
} from '@/features/hr/attendance/components/attendance-punch-pair';

type Props = {
  employeeEvents: AttendanceEventResponseDto[];
  effectiveFrom: string;
  effectiveTo: string;
  loading?: boolean;
};

type DayGroup = {
  checkIn?: AttendanceEventResponseDto;
  checkOut?: AttendanceEventResponseDto;
  breakStart?: AttendanceEventResponseDto;
  breakEnd?: AttendanceEventResponseDto;
};

function buildDayGroups(employeeEvents: AttendanceEventResponseDto[]): [string, DayGroup][] {
  const grouped = new Map<string, DayGroup>();
  for (const evt of [...employeeEvents]
    .filter((e) => !e.isVoided)
    .sort((a, b) => b.workDate.localeCompare(a.workDate) || a.occurredAt.localeCompare(b.occurredAt))) {
    if (!grouped.has(evt.workDate)) grouped.set(evt.workDate, {});
    const g = grouped.get(evt.workDate)!;
    if (evt.eventType === 'check_in' && !g.checkIn) g.checkIn = evt;
    if (evt.eventType === 'check_out') g.checkOut = evt;
    if (evt.eventType === 'break_start' && !g.breakStart) g.breakStart = evt;
    if (evt.eventType === 'break_end') g.breakEnd = evt;
  }
  return [...grouped.entries()];
}

function AttendanceDayRow({ date, g }: { date: string; g: DayGroup }) {
  const dur = durationBetweenIso(g.checkIn?.occurredAt, g.checkOut?.occurredAt);
  const brk = durationBetweenIso(g.breakStart?.occurredAt, g.breakEnd?.occurredAt);
  const location = g.checkIn?.checkInPointNameAr ?? g.checkOut?.checkInPointNameAr ?? null;
  const inSource = g.checkIn?.source ? ATTENDANCE_SOURCE_LABEL[g.checkIn.source] ?? g.checkIn.source : null;
  const outSource = g.checkOut?.source ? ATTENDANCE_SOURCE_LABEL[g.checkOut.source] ?? g.checkOut.source : null;
  const notes = [g.checkIn?.notes, g.checkOut?.notes].filter(Boolean).join(' · ');
  const hasPunches = Boolean(g.checkIn || g.checkOut);
  const statusHint =
    g.checkIn && !g.checkOut
      ? 'لم يُسجّل خروج'
      : !g.checkIn && g.checkOut
        ? 'لم يُسجّل دخول'
        : null;

  return (
    <div className="px-3 py-3 transition-colors hover:bg-muted/25 sm:px-4">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[7.5rem_minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start lg:gap-4">
        <div className="flex items-center gap-2 lg:pt-2">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{formatDate(date)}</span>
        </div>

        {hasPunches ? (
          <AttendancePunchPair
            checkInTime={formatIsoTimeAr(g.checkIn?.occurredAt)}
            checkOutTime={formatIsoTimeAr(g.checkOut?.occurredAt)}
            checkInSource={inSource}
            checkOutSource={outSource}
            duration={dur}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-3 py-4 text-center text-xs text-muted-foreground">
            لا توجد حركات حضور في هذا اليوم
          </p>
        )}

        <div className="min-w-0 space-y-1 text-xs text-muted-foreground lg:pt-2">
          {statusHint ? <p className="font-medium text-warning">{statusHint}</p> : null}
          {location ? (
            <p className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
          {brk ? (
            <p className="flex items-center gap-1">
              <Coffee className="h-3 w-3 shrink-0" />
              استراحة {brk}
            </p>
          ) : null}
          {notes ? <p className="leading-relaxed text-foreground/80">{notes}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function EmployeeAttendanceRecentEvents({
  employeeEvents,
  effectiveFrom,
  effectiveTo,
  loading = false,
}: Props) {
  const dayGroups = React.useMemo(() => buildDayGroups(employeeEvents), [employeeEvents]);

  return (
    <EmployeeProfilePagedList
      items={dayGroups}
      resetDeps={[effectiveFrom, effectiveTo, employeeEvents.length]}
      loading={loading}
      empty={<Empty icon={Clock} text="لا توجد حركات حضور حتى الآن" />}
      renderItems={(pageDays) => (
        <div className="overflow-hidden rounded-lg border border-border/50">
          <div className="hidden border-b border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground lg:grid lg:grid-cols-[7.5rem_minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-4">
            <span>التاريخ</span>
            <span>الدخول والخروج</span>
            <span>التفاصيل</span>
          </div>
          <div className="divide-y divide-border/60">
            {pageDays.map(([date, g]) => (
              <AttendanceDayRow key={date} date={date} g={g} />
            ))}
          </div>
        </div>
      )}
    />
  );
}
