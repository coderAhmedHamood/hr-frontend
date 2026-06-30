'use client';

import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import {
  formatDaySummaryMetric,
  getDaySummaryMetricMinutes,
  type DaySummaryDailyMetricKey,
} from '@/features/hr/attendance/day-summaries/utils/day-summary-display';
import { SummaryMinutesCell } from '@/features/hr/attendance/day-summaries/components/summary-minutes-cell';
import { cn } from '@/shared/utils';

type DaySummaryMetricCellProps = {
  row: DaySummaryResponseDto;
  metric: DaySummaryDailyMetricKey;
  emptyWhenZero?: boolean;
  tone?: 'default' | 'warn' | 'success' | 'danger';
};

export function DaySummaryMetricCell({
  row,
  metric,
  emptyWhenZero,
  tone = 'default',
}: DaySummaryMetricCellProps) {
  const minutes = getDaySummaryMetricMinutes(row, metric);
  const formatted = formatDaySummaryMetric(row, metric);

  if (emptyWhenZero && minutes <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (!formatted) {
    return <SummaryMinutesCell minutes={null} />;
  }

  const toneClass =
    tone === 'warn' && minutes > 0
      ? 'font-medium text-warning'
      : tone === 'success' && minutes > 0
        ? 'font-medium text-success'
        : tone === 'danger' && minutes > 0
          ? 'font-medium text-destructive'
          : undefined;

  return (
    <span className={cn('tabular-nums font-mono text-sm', toneClass)}>
      {formatted}
    </span>
  );
}
