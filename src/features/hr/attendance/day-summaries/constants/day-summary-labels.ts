import type { AttendanceDayStatus } from '@/features/hr/attendance/types/api/attendance-day-summaries';
import { STATUS_PILL } from '@/shared/status-pill-classes';

export const DAY_SUMMARY_STATUS_LABELS: Record<AttendanceDayStatus, string> = {
  present: 'حاضر',
  partial: 'حضور جزئي',
  late: 'متأخر',
  absent: 'غائب',
  rest_day: 'يوم راحة',
  unscheduled: 'غير مجدول',
  holiday: 'عطلة رسمية',
  on_leave: 'إجازة',
};

export const DAY_SUMMARY_STATUS_ORDER: AttendanceDayStatus[] = [
  'present',
  'partial',
  'late',
  'absent',
  'on_leave',
  'holiday',
  'rest_day',
  'unscheduled',
];

export const DAY_SUMMARY_STATUS_BADGE: Record<AttendanceDayStatus, string> = {
  present: STATUS_PILL.approved,
  partial: STATUS_PILL.warning,
  late: STATUS_PILL.warning,
  absent: STATUS_PILL.rejected,
  rest_day: STATUS_PILL.muted,
  unscheduled: STATUS_PILL.muted,
  holiday: STATUS_PILL.gold,
  on_leave: STATUS_PILL.info,
};

export function daySummaryStatusLabel(status: AttendanceDayStatus): string {
  return DAY_SUMMARY_STATUS_LABELS[status];
}

export function daySummaryStatusBadgeClass(status: AttendanceDayStatus): string {
  return DAY_SUMMARY_STATUS_BADGE[status];
}

export const AR_MONTH_NAMES = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;
