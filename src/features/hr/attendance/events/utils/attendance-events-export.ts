import type { RegisterColumn } from '@/components/pdf/print/register-document';
import type {
  AttendanceEventResponseDto,
  AttendanceEventType,
} from '@/features/hr/attendance/lib/api/attendance-events';
import { exportDate } from '@/features/hr/attendance/lib/attendance-export-format';
import { getDisplayDateTimeParts } from '@/shared/utils';

export const ATTENDANCE_EVENT_TYPE_LABELS: Record<AttendanceEventType, string> = {
  check_in: 'دخول',
  check_out: 'خروج',
  break_start: 'بداية استراحة',
  break_end: 'نهاية استراحة',
};

export const ATTENDANCE_EVENT_SOURCE_LABELS: Record<string, string> = {
  mobile_app: 'تطبيق الجوال',
  web_portal: 'بوابة الويب',
  kiosk: 'كشك',
  manual_hr: 'يدوي — HR',
  biometric: 'بصمة',
  system: 'النظام',
};

export const ATTENDANCE_EVENTS_EXPORT_COLUMNS: RegisterColumn[] = [
  { label: 'الموظف', kind: 'name' },
  { label: 'اليوم', kind: 'date' },
  { label: 'نوع الحدث', kind: 'status' },
  { label: 'الوقت', kind: 'number', weight: 1.3 },
  { label: 'المصدر', kind: 'text', weight: 1.8 },
  { label: 'نقطة التسجيل', kind: 'text' },
  { label: 'النطاق', kind: 'status' },
];

function timeCell(iso: string): string {
  const parts = getDisplayDateTimeParts(iso);
  return parts ? `${parts.hours}:${parts.minutes}${parts.period}` : '—';
}

/** Rows as the panel shows them: newest work day first (the panel groups by day). */
export function attendanceEventsExportRows(events: AttendanceEventResponseDto[]): string[][] {
  return [...events]
    .sort((a, b) => b.workDate.localeCompare(a.workDate))
    .map((e) => [
      e.isVoided ? `${e.employeeNameAr} (ملغى)` : e.employeeNameAr,
      exportDate(e.workDate),
      ATTENDANCE_EVENT_TYPE_LABELS[e.eventType] ?? e.eventType,
      timeCell(e.occurredAt),
      ATTENDANCE_EVENT_SOURCE_LABELS[e.source ?? ''] ?? e.source ?? '—',
      e.checkInPointNameAr ?? '—',
      e.withinRadius === null ? '—' : e.withinRadius ? 'داخل النطاق' : 'خارج النطاق',
    ]);
}
