import type { RegisterColumn } from '@/components/pdf/print/register-document';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { daySummaryStatusLabel } from '@/features/hr/attendance/day-summaries/constants/day-summary-labels';
import {
  DAY_SUMMARY_COLUMN_OPTIONS,
  type DaySummaryColumnVisibility,
  type DaySummaryOptionalColumnKey,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-column-config';
import {
  formatDaySummaryMetric,
  getDaySummaryMetricMinutes,
  type DaySummaryDailyMetricKey,
} from '@/features/hr/attendance/day-summaries/utils/day-summary-display';
import { exportDate, exportDateTime } from '@/features/hr/attendance/lib/attendance-export-format';

type ExportColumn = RegisterColumn & { value: (row: DaySummaryResponseDto) => string };

/** A metric as the table shows it: «—» when empty/zero, else HH:MM. */
function metric(key: DaySummaryDailyMetricKey, emptyWhenZero = true) {
  return (row: DaySummaryResponseDto) => {
    if (emptyWhenZero && getDaySummaryMetricMinutes(row, key) <= 0) return '—';
    return formatDaySummaryMetric(row, key) ?? '—';
  };
}

const PINNED: ExportColumn[] = [
  { label: 'الموظف', kind: 'name', value: (r) => r.employeeNameAr ?? '—' },
  { label: 'اليوم', kind: 'date', value: (r) => exportDate(r.workDate) },
  { label: 'الحالة', kind: 'status', value: (r) => daySummaryStatusLabel(r.status) },
];

/** Optional data columns (the «تسوية» action column is not exported). */
const OPTIONAL: Partial<Record<DaySummaryOptionalColumnKey, ExportColumn>> = {
  checkIn: { label: 'أول حضور', kind: 'date', weight: 1.9, value: (r) => exportDateTime(r.actualCheckInAt) },
  checkOut: { label: 'آخر انصراف', kind: 'date', weight: 1.9, value: (r) => exportDateTime(r.actualCheckOutAt) },
  expected: { label: 'متوقع', kind: 'number', value: metric('expected', false) },
  total: { label: 'فعلي', kind: 'number', value: metric('total', false) },
  insidePeriods: { label: 'داخل الفترات', kind: 'number', value: metric('insidePeriods') },
  late: { label: 'تأخير', kind: 'number', value: metric('late') },
  earlyLeave: { label: 'انصراف مبكر', kind: 'number', value: metric('earlyLeave') },
  earlyArrival: { label: 'حضور مبكر', kind: 'number', value: metric('earlyArrival') },
  shortage: { label: 'نقص', kind: 'number', value: metric('shortage') },
  overtime: { label: 'إضافي', kind: 'number', value: metric('overtime') },
  manual: { label: 'يدوي', kind: 'status', value: (r) => (r.isManualOverride ? 'نعم' : '—') },
  finalized: { label: 'مقفل', kind: 'status', value: (r) => (r.isFinalized ? 'مقفل' : '—') },
  overtimePayroll: {
    label: 'إضافي رواتب',
    kind: 'status',
    value: (r) => (r.overtimePayrollAllowed ? 'مسموح' : '—'),
  },
};

/** The exported columns: the pinned ones plus the data columns visible in the column picker. */
export function daySummaryExportColumns(
  visibility: DaySummaryColumnVisibility,
  opts?: { branchByEmployeeId?: Map<string, string> },
): ExportColumn[] {
  const optional = DAY_SUMMARY_COLUMN_OPTIONS.filter((o) => visibility[o.key])
    .map((o) => OPTIONAL[o.key])
    .filter((c): c is ExportColumn => c != null);
  const branchColumn: ExportColumn | null = opts?.branchByEmployeeId
    ? {
        label: 'الفرع',
        kind: 'text',
        weight: 1.8,
        value: (r) => opts.branchByEmployeeId!.get(r.employeeId)?.trim() || '—',
      }
    : null;
  return branchColumn
    ? [PINNED[0]!, branchColumn, ...PINNED.slice(1), ...optional]
    : [...PINNED, ...optional];
}

export function daySummaryExportRow(columns: ExportColumn[], row: DaySummaryResponseDto): string[] {
  return columns.map((c) => c.value(row));
}
