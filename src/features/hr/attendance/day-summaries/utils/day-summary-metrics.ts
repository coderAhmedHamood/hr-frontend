import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';

/** Minutes between two ISO timestamps (start → end). */
export function isoDurationMinutes(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
): number | null {
  if (!startAt || !endAt) return null;
  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null;
  return Math.round((endMs - startMs) / 60000);
}

/** Raw punch span — الفارق بين أول حضور وآخر انصراف. */
export function computePunchSpanMinutes(row: DaySummaryResponseDto): number | null {
  return isoDurationMinutes(row.actualCheckInAt, row.actualCheckOutAt);
}
