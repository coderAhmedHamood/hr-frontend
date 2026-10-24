import type { RegisterColumn } from '@/components/pdf/print/register-document';
import type { ShiftTemplate } from '@/features/hr/attendance/lib/types';
import { DAY_LABELS, WEEK_ORDER } from '@/features/hr/attendance/templates/constants/shift-templates-ui';
import { exportDate } from '@/features/hr/attendance/lib/attendance-export-format';

export const SHIFT_TEMPLATE_EXPORT_COLUMNS: RegisterColumn[] = [
  { label: 'الاسم', kind: 'name' },
  { label: 'الحالة', kind: 'status' },
  { label: 'أيام العمل', kind: 'text', weight: 3 },
  { label: 'أوقات الدوام', kind: 'text' },
  { label: 'ساري من', kind: 'date' },
];

/** One row per template: work days in week order and the distinct period times. */
export function shiftTemplateExportRow(t: ShiftTemplate): string[] {
  const workDays = WEEK_ORDER.map((day) => t.weekDays.find((w) => w.day === day)).filter(
    (w): w is NonNullable<typeof w> => !!w && !w.isRest,
  );
  const times = [
    ...new Set(
      workDays.map((w) => w.periods.map((p) => `${p.startTime} – ${p.endTime}`).join(' / ')).filter(Boolean),
    ),
  ];
  return [
    t.nameAr,
    t.isActive ? 'نشط' : 'موقوف',
    workDays.length > 0 ? workDays.map((w) => DAY_LABELS[w.day]).join('، ') : '—',
    times.length > 0 ? times.join('، ') : '—',
    exportDate(t.effectiveFrom),
  ];
}
