import type { DaySummaryStatus } from '@/features/hr/attendance/lib/types';
import { STATUS, type StatusVisualKey } from '@/features/hr/attendance/daily/constants/daily-attendance-status';

export function resolveVisualKey(s: DaySummaryStatus): StatusVisualKey {
  if (s === 'holiday') return 'holiday';
  if (s === 'rest_day') return 'rest_day';
  if (s === 'unscheduled') return 'unscheduled';
  if (s === 'on_leave') return 'on_leave';
  if (s === 'overtime') return 'present';
  if (s === 'incomplete') return 'absent';
  if (s === 'present' || s === 'partial' || s === 'late' || s === 'absent' || s === 'early_leave') return s;
  return 'present';
}

export function cfgFor(s: DaySummaryStatus) {
  return STATUS[resolveVisualKey(s)];
}
