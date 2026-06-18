'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, CircleDot, Clock, Coffee, ExternalLink, MapPin, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/shared/utils';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfilePagedList } from '@/features/hr/organization/employees/components/employee-profile-paged-list';
import type { AttendanceEventResponseDto } from '@/features/hr/attendance/lib/api/attendance-events';

type Props = {
  employeeEvents: AttendanceEventResponseDto[];
  effectiveFrom: string;
  effectiveTo: string;
  loading?: boolean;
};

const SRC_LABEL: Record<string, string> = {
  mobile_app: 'تطبيق',
  web_portal: 'بوابة',
  kiosk: 'كشك',
  manual_hr: 'يدوي',
  biometric: 'بصمة',
  system: 'نظام',
};

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'ص' : 'م';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${m} ${period}`;
}

function durLabel(fromIso?: string | null, toIso?: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const mins = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000;
  if (!Number.isFinite(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}س${m > 0 ? ` ${m}د` : ''}` : `${m}د`;
}

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
  const dur = durLabel(g.checkIn?.occurredAt, g.checkOut?.occurredAt);
  const brk = durLabel(g.breakStart?.occurredAt, g.breakEnd?.occurredAt);
  const location = g.checkIn?.checkInPointNameAr ?? g.checkOut?.checkInPointNameAr ?? null;
  const inSource = g.checkIn?.source ? SRC_LABEL[g.checkIn.source] ?? g.checkIn.source : null;
  const outSource = g.checkOut?.source ? SRC_LABEL[g.checkOut.source] ?? g.checkOut.source : null;
  const notes = [g.checkIn?.notes, g.checkOut?.notes].filter(Boolean).join(' · ');

  return (
    <div className="grid gap-2 px-4 py-3 transition-colors hover:bg-muted/25 sm:grid-cols-[7.5rem_5rem_5rem_4rem_minmax(0,1fr)] sm:items-center sm:gap-3">
      <div className="flex items-center gap-2 sm:block">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:hidden" />
        <span className="text-sm font-medium text-foreground">{formatDate(date)}</span>
      </div>

      <div className="flex items-center gap-2 sm:justify-center">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success sm:hidden" />
        <div className="min-w-0 sm:text-center">
          <p className="font-mono text-sm font-semibold tabular-nums text-success">
            {fmtTime(g.checkIn?.occurredAt)}
          </p>
          {inSource ? <p className="text-[10px] text-muted-foreground">{inSource}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-center">
        <CircleDot className="h-3.5 w-3.5 shrink-0 text-warning sm:hidden" />
        <div className="min-w-0 sm:text-center">
          <p className="font-mono text-sm font-semibold tabular-nums text-warning">
            {fmtTime(g.checkOut?.occurredAt)}
          </p>
          {outSource ? <p className="text-[10px] text-muted-foreground">{outSource}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-center">
        <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70 sm:hidden" />
        <span className="font-mono text-sm font-semibold tabular-nums text-primary">
          {dur ?? '—'}
        </span>
      </div>

      <div className="min-w-0 space-y-0.5 text-xs text-muted-foreground">
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
        {notes ? <p className="line-clamp-2 leading-relaxed text-foreground/80">{notes}</p> : null}
        {!location && !brk && !notes && !g.checkIn && !g.checkOut ? (
          <span className="text-muted-foreground/60">لا توجد حركات</span>
        ) : null}
        {g.checkIn && !g.checkOut ? (
          <span className="text-warning">لم يُسجّل خروج</span>
        ) : null}
        {!g.checkIn && g.checkOut ? (
          <span className="text-warning">لم يُسجّل دخول</span>
        ) : null}
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
      fillParent
      items={dayGroups}
      resetDeps={[effectiveFrom, effectiveTo, employeeEvents.length]}
      loading={loading}
      empty={<Empty icon={Clock} text="لا توجد حركات حضور حتى الآن" />}
      renderItems={(pageDays) => (
        <div className="overflow-hidden rounded-lg border border-border/50">
          <div className="hidden border-b border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:grid sm:grid-cols-[7.5rem_5rem_5rem_4rem_minmax(0,1fr)] sm:gap-3">
            <span>التاريخ</span>
            <span className="text-center">دخول</span>
            <span className="text-center">خروج</span>
            <span className="text-center">المدة</span>
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
