'use client';

import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { cn } from '@/shared/utils';

type SummaryMinutesCellProps = {
  minutes: number | null;
  /** When true, zero shows an em dash instead of 00:00. */
  emptyWhenZero?: boolean;
  tone?: 'default' | 'warn' | 'success';
};

export function SummaryMinutesCell({
  minutes,
  emptyWhenZero,
  tone = 'default',
}: SummaryMinutesCellProps) {
  if (minutes == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (emptyWhenZero && minutes <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        'tabular-nums font-mono text-sm',
        tone === 'warn' && minutes > 0 && 'font-medium text-warning',
        tone === 'success' && minutes > 0 && 'font-medium text-success',
      )}
    >
      {minutesToHHMM(minutes)}
    </span>
  );
}
