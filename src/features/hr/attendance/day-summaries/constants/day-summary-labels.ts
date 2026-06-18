import type { AttendanceDayStatus } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { STATUS_PILL } from '@/shared/status-pill-classes';

export const DAY_SUMMARY_STATUS_LABELS: Record<AttendanceDayStatus, string> = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
  rest_day: 'يوم راحة',
  unscheduled: 'غير مجدول',
  holiday: 'عطلة رسمية',
  on_leave: 'إجازة',
};

export const DAY_SUMMARY_STATUS_ORDER: AttendanceDayStatus[] = [
  'present',
  'late',
  'absent',
  'on_leave',
  'holiday',
  'rest_day',
  'unscheduled',
];

export const DAY_SUMMARY_STATUS_BADGE: Record<AttendanceDayStatus, string> = {
  present: STATUS_PILL.approved,
  late: STATUS_PILL.warning,
  absent: STATUS_PILL.rejected,
  rest_day: STATUS_PILL.muted,
  unscheduled: STATUS_PILL.muted,
  holiday: STATUS_PILL.gold,
  on_leave: STATUS_PILL.info,
};

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
