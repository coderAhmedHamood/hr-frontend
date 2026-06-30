'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { formatTime } from '@/shared/utils';
import { cn } from '@/shared/utils';
import type { AttendanceCorrectionPeriod } from '@/features/hr/requests/lib/attendance-correction-store';

function periodBadgeLabel(index: number, total: number): string {
  if (total <= 1) return 'بعد';
  return String(index + 1);
}

function formatClockValue(value: string | null | undefined): string {
  if (!value) return '—';
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [hStr, mStr] = value.split(':');
    const h = parseInt(hStr ?? '0', 10);
    const m = mStr ?? '00';
    if (isNaN(h)) return value;
    const period = h < 12 ? 'ص' : 'م';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
  }
  return formatTime(value);
}

function CompactTimeRange({
  start,
  end,
  className,
}: {
  start: string;
  end: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1 font-mono text-[11px] tabular-nums leading-none',
        className,
      )}
      dir="ltr"
    >
      <span className="truncate">{start}</span>
      <ArrowLeft className="h-3 w-3 shrink-0 text-muted-foreground/50" aria-hidden />
      <span className="truncate">{end}</span>
    </span>
  );
}

function TimesBadge({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode;
  tone?: 'muted' | 'primary';
}) {
  return (
    <span
      className={cn(
        'inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded px-1 text-[9px] font-bold leading-none',
        tone === 'primary'
          ? 'bg-primary/12 text-primary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}

/** Compact before/after comparison for table rows and mobile cards. */
export function CorrectionTimesComparisonCell({
  previousCheckIn,
  previousCheckOut,
  correctedPeriods,
}: {
  previousCheckIn: string;
  previousCheckOut: string;
  correctedPeriods: AttendanceCorrectionPeriod[];
}) {
  const hasPrevious = Boolean(previousCheckIn || previousCheckOut);
  const hasCorrected = correctedPeriods.length > 0;

  if (!hasPrevious && !hasCorrected) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-[8.5rem] max-w-[11rem] space-y-1">
      {hasPrevious ? (
        <div className="flex items-center gap-1.5">
          <TimesBadge tone="muted">قبل</TimesBadge>
          <CompactTimeRange
            start={formatClockValue(previousCheckIn)}
            end={formatClockValue(previousCheckOut)}
            className="text-muted-foreground"
          />
        </div>
      ) : null}

      {hasCorrected ? (
        <div className="space-y-0.5">
          {correctedPeriods.map((p, i) => (
            <div key={p.periodId || i} className="flex items-center gap-1.5">
              <TimesBadge tone="primary">
                {periodBadgeLabel(i, correctedPeriods.length)}
              </TimesBadge>
              <CompactTimeRange
                start={formatClockValue(p.checkInAt)}
                end={formatClockValue(p.checkOutAt)}
                className="text-foreground"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Legacy single-side cell — kept for narrow contexts. */
export function CorrectionPeriodTimesCell({
  periods,
}: {
  periods: AttendanceCorrectionPeriod[];
  inLabel?: string;
  outLabel?: string;
}) {
  if (!periods.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-0.5">
      {periods.map((p, i) => (
        <div key={p.periodId || i} className="flex items-center gap-1.5">
          {periods.length > 1 ? (
            <TimesBadge tone="primary">{String(i + 1)}</TimesBadge>
          ) : null}
          <CompactTimeRange
            start={formatClockValue(p.checkInAt)}
            end={formatClockValue(p.checkOutAt)}
          />
        </div>
      ))}
    </div>
  );
}

export function CorrectionTimesComparisonDetail({
  previousCheckIn,
  previousCheckOut,
  correctedPeriods,
}: {
  previousCheckIn: string;
  previousCheckOut: string;
  correctedPeriods: AttendanceCorrectionPeriod[];
}) {
  const hasPrevious = Boolean(previousCheckIn || previousCheckOut);
  const hasCorrected = correctedPeriods.length > 0;

  if (!hasPrevious && !hasCorrected) {
    return (
      <div className="sm:col-span-2">
        <p className="text-xs text-muted-foreground">أوقات التصحيح</p>
        <p className="text-sm">—</p>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 space-y-2">
      <p className="text-xs text-muted-foreground">أوقات التصحيح</p>
      <div className="overflow-hidden rounded-xl border border-border/60">
        {hasPrevious ? (
          <div className="grid grid-cols-[4.5rem_1fr_1fr] gap-3 border-b border-border/50 bg-muted/25 px-3 py-2.5 text-xs">
            <span className="self-center font-medium text-muted-foreground">قبل</span>
            <div>
              <p className="text-[10px] text-muted-foreground">حضور</p>
              <p className="font-mono text-sm">{formatClockValue(previousCheckIn)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">انصراف</p>
              <p className="font-mono text-sm">{formatClockValue(previousCheckOut)}</p>
            </div>
          </div>
        ) : null}

        {correctedPeriods.map((p, i) => (
          <div
            key={p.periodId || i}
            className={cn(
              'grid grid-cols-[4.5rem_1fr_1fr] gap-3 px-3 py-2.5 text-xs',
              i % 2 === 0 ? 'bg-background' : 'bg-muted/10',
              i < correctedPeriods.length - 1 && 'border-b border-border/40',
            )}
          >
            <span className="self-center font-medium text-primary">
              {correctedPeriods.length > 1 ? `فترة ${i + 1}` : 'بعد'}
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">حضور</p>
              <p className="font-mono text-sm">{formatClockValue(p.checkInAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">انصراف</p>
              <p className="font-mono text-sm">{formatClockValue(p.checkOutAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use CorrectionTimesComparisonDetail */
export function CorrectionPeriodTimesDetail({
  periods,
  title = 'الأوقات المصححة',
}: {
  periods: AttendanceCorrectionPeriod[];
  title?: string;
}) {
  if (!periods.length) {
    return (
      <div className="sm:col-span-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm">—</p>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 space-y-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      <div className="divide-y divide-border rounded-xl border border-border/60 overflow-hidden">
        {periods.map((p, i) => (
          <div
            key={p.periodId || i}
            className="grid gap-3 bg-muted/20 px-3 py-2.5 sm:grid-cols-[minmax(0,5rem)_1fr_1fr]"
          >
            <p className="text-xs font-medium text-primary self-center">
              {periods.length > 1 ? `فترة ${i + 1}` : 'بعد'}
            </p>
            <div>
              <p className="text-[10px] text-muted-foreground">حضور</p>
              <p className="text-sm font-medium font-mono">{formatClockValue(p.checkInAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">انصراف</p>
              <p className="text-sm font-medium font-mono">{formatClockValue(p.checkOutAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
