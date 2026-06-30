/** Visual keys for daily attendance UI (maps domain statuses). */
import { STATUS_PILL, statusDotClass } from '@/shared/status-pill-classes';

export const STATUS = {
  present: {
    label: 'حاضر',
    color: 'bg-success/10 text-success border-success/30',
    dot: 'bg-success',
    bar: 'bg-success',
  },
  late: {
    label: 'متأخر',
    color: 'bg-warning/10 text-warning border-warning/30',
    dot: 'bg-warning',
    bar: 'bg-warning',
  },
  partial: {
    label: 'حضور جزئي',
    color: 'bg-warning/10 text-warning border-warning/30',
    dot: 'bg-warning',
    bar: 'bg-warning/70',
  },
  absent: {
    label: 'غائب',
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    dot: 'bg-destructive',
    bar: 'bg-destructive/60',
  },
  early_leave: {
    label: 'انصراف مبكر',
    color: 'bg-warning/15 text-warning border-warning/40',
    dot: 'bg-warning',
    bar: 'bg-warning/70',
  },
  holiday: {
    label: 'عطلة رسمية',
    color: STATUS_PILL.gold,
    dot: statusDotClass('gold'),
    bar: 'bg-gold',
  },
  rest_day: {
    label: 'يوم راحة',
    color: STATUS_PILL.muted,
    dot: statusDotClass('muted'),
    bar: 'bg-muted-foreground/50',
  },
  unscheduled: {
    label: 'غير مجدول',
    color: STATUS_PILL.muted,
    dot: statusDotClass('muted'),
    bar: 'bg-muted-foreground/40',
  },
  on_leave: {
    label: 'إجازة',
    color: STATUS_PILL.info,
    dot: statusDotClass('info'),
    bar: 'bg-primary',
  },
} as const;

export type StatusVisualKey = keyof typeof STATUS;

export const ATT_VISUAL_STATUS_ORDER: StatusVisualKey[] = [
  'present',
  'partial',
  'late',
  'absent',
  'early_leave',
  'on_leave',
  'holiday',
  'rest_day',
  'unscheduled',
];

export const DEFAULT_ABSENT_DAY_HOURS = 8;
