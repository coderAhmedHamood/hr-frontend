import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  ArrowLeftRight,
  Banknote,
  Clock,
  DoorOpen,
  Layers,
  LogIn,
  LogOut,
  PenLine,
  PlusCircle,
  Lock,
  Sunrise,
  Timer,
  TrendingDown,
} from 'lucide-react';

/** Optional columns — employee / date / status are always visible. */
export type DaySummaryOptionalColumnKey =
  | 'checkIn'
  | 'checkOut'
  | 'expected'
  | 'total'
  | 'insidePeriods'
  | 'late'
  | 'earlyLeave'
  | 'earlyArrival'
  | 'shortage'
  | 'overtime'
  | 'manual'
  | 'finalized'
  | 'overtimePayroll'
  | 'settle';

export type DaySummaryColumnVisibility = Record<DaySummaryOptionalColumnKey, boolean>;

export type DaySummaryColumnOption = {
  key: DaySummaryOptionalColumnKey;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  group: 'times' | 'metrics' | 'actions';
};

export const DAY_SUMMARY_COLUMN_OPTIONS: DaySummaryColumnOption[] = [
  { key: 'checkIn', label: 'حضور', icon: LogIn, group: 'times' },
  { key: 'checkOut', label: 'انصراف', icon: LogOut, group: 'times' },
  { key: 'expected', label: 'متوقع', icon: Clock, group: 'metrics' },
  { key: 'total', label: 'فعلي', icon: Timer, group: 'metrics' },
  { key: 'insidePeriods', label: 'داخل الفترات', shortLabel: 'داخل', icon: Layers, group: 'metrics' },
  { key: 'late', label: 'تأخير', icon: AlarmClock, group: 'metrics' },
  { key: 'earlyLeave', label: 'انصراف مبكر', shortLabel: 'مبكر', icon: DoorOpen, group: 'metrics' },
  { key: 'earlyArrival', label: 'حضور مبكر', shortLabel: 'مبكر+', icon: Sunrise, group: 'metrics' },
  { key: 'shortage', label: 'نقص', icon: TrendingDown, group: 'metrics' },
  { key: 'overtime', label: 'إضافي', icon: PlusCircle, group: 'metrics' },
  { key: 'manual', label: 'تعديل يدوي', shortLabel: 'يدوي', icon: PenLine, group: 'actions' },
  { key: 'finalized', label: 'مقفل (رواتب)', shortLabel: 'مقفل', icon: Lock, group: 'actions' },
  { key: 'overtimePayroll', label: 'إضافي رواتب', shortLabel: 'رواتب', icon: Banknote, group: 'actions' },
  { key: 'settle', label: 'تسوية', icon: ArrowLeftRight, group: 'actions' },
];

export const DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY: DaySummaryColumnVisibility = {
  checkIn: true,
  checkOut: true,
  expected: true,
  total: true,
  insidePeriods: false,
  late: true,
  earlyLeave: false,
  earlyArrival: false,
  shortage: true,
  overtime: true,
  manual: false,
  finalized: true,
  overtimePayroll: true,
  settle: true,
};

export function normalizeDaySummaryColumnVisibility(
  raw: Partial<DaySummaryColumnVisibility> | null | undefined,
): DaySummaryColumnVisibility {
  return {
    ...DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY,
    ...raw,
  };
}

export function countVisibleDaySummaryColumns(visibility: DaySummaryColumnVisibility): number {
  return DAY_SUMMARY_COLUMN_OPTIONS.filter((col) => visibility[col.key]).length;
}
