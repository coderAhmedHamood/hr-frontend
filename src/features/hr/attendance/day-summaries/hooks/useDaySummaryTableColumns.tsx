'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { TableDateCell } from '@/components/ui/table-cells';
import type { ColumnDef } from '@/components/ui/data-table';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import {
  daySummaryStatusBadgeClass,
  daySummaryStatusLabel,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-labels';
import {
  DAY_SUMMARY_COLUMN_OPTIONS,
  type DaySummaryColumnVisibility,
  type DaySummaryOptionalColumnKey,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-column-config';
import { DaySummaryMetricCell } from '@/features/hr/attendance/day-summaries/components/day-summary-metric-cell';
import { DaySummaryOvertimePayrollToggle } from '@/features/hr/attendance/day-summaries/components/day-summary-overtime-payroll-toggle';
import { DaySummarySettleButton } from '@/features/hr/attendance/day-summaries/components/day-summary-settle-button';
import { cn } from '@/shared/utils';

type UseDaySummaryTableColumnsParams = {
  visibility: DaySummaryColumnVisibility;
  overtimePayrollBusyId: string | null;
  onOvertimePayrollToggle: (row: DaySummaryResponseDto, allowed: boolean) => void;
  onRequestSettle: (row: DaySummaryResponseDto) => void;
};

export function useDaySummaryTableColumns({
  visibility,
  overtimePayrollBusyId,
  onOvertimePayrollToggle,
  onRequestSettle,
}: UseDaySummaryTableColumnsParams): ColumnDef<DaySummaryResponseDto>[] {
  return React.useMemo(() => {
    const optionalColumns: Record<
      DaySummaryOptionalColumnKey,
      ColumnDef<DaySummaryResponseDto>
    > = {
      checkIn: {
        key: 'checkIn',
        title: 'حضور',
        hideOnMobile: true,
        render: (row) => <TableDateCell value={row.actualCheckInAt} mode="datetime" />,
      },
      checkOut: {
        key: 'checkOut',
        title: 'انصراف',
        hideOnMobile: true,
        render: (row) => <TableDateCell value={row.actualCheckOutAt} mode="datetime" />,
      },
      expected: {
        key: 'expected',
        title: 'متوقع',
        hideOnMobile: true,
        render: (row) => <DaySummaryMetricCell row={row} metric="expected" />,
      },
      total: {
        key: 'total',
        title: 'فعلي',
        render: (row) => <DaySummaryMetricCell row={row} metric="total" />,
      },
      insidePeriods: {
        key: 'insidePeriods',
        title: 'داخل الفترات',
        hideOnMobile: true,
        render: (row) => (
          <DaySummaryMetricCell row={row} metric="insidePeriods" emptyWhenZero />
        ),
      },
      late: {
        key: 'late',
        title: 'تأخير',
        render: (row) => (
          <DaySummaryMetricCell row={row} metric="late" emptyWhenZero tone="warn" />
        ),
      },
      earlyLeave: {
        key: 'earlyLeave',
        title: 'انصراف مبكر',
        hideOnMobile: true,
        render: (row) => (
          <DaySummaryMetricCell row={row} metric="earlyLeave" emptyWhenZero tone="warn" />
        ),
      },
      earlyArrival: {
        key: 'earlyArrival',
        title: 'حضور مبكر',
        hideOnMobile: true,
        render: (row) => (
          <DaySummaryMetricCell row={row} metric="earlyArrival" emptyWhenZero tone="success" />
        ),
      },
      shortage: {
        key: 'shortage',
        title: 'نقص',
        render: (row) => (
          <DaySummaryMetricCell row={row} metric="shortage" emptyWhenZero tone="danger" />
        ),
      },
      overtime: {
        key: 'overtime',
        title: 'إضافي',
        render: (row) => (
          <DaySummaryMetricCell row={row} metric="overtime" emptyWhenZero tone="success" />
        ),
      },
      manual: {
        key: 'manual',
        title: 'يدوي',
        hideOnMobile: true,
        render: (row) => (row.isManualOverride ? 'نعم' : '—'),
      },
      finalized: {
        key: 'finalized',
        title: 'مقفل',
        hideOnMobile: true,
        render: (row) =>
          row.isFinalized ? (
            <Badge variant="secondary" className="text-[10px] font-normal">
              مقفل
            </Badge>
          ) : (
            '—'
          ),
      },
      overtimePayroll: {
        key: 'overtimePayroll',
        title: 'إضافي رواتب',
        hideOnMobile: true,
        isActions: true,
        headerClassName: 'text-center',
        className: 'text-center',
        render: (row) => (
          <DaySummaryOvertimePayrollToggle
            row={row}
            disabled={overtimePayrollBusyId === row.id}
            onToggle={onOvertimePayrollToggle}
          />
        ),
      },
      settle: {
        key: 'settle',
        title: 'تسوية',
        isActions: true,
        headerClassName: 'text-center',
        className: 'text-center',
        render: (row) => (
          <DaySummarySettleButton row={row} onRequestSettle={onRequestSettle} />
        ),
      },
    };

    const pinned: ColumnDef<DaySummaryResponseDto>[] = [
      {
        key: 'employee',
        title: 'الموظف',
        render: (row) => (
          <span className="font-medium">{row.employeeNameAr ?? '—'}</span>
        ),
      },
      {
        key: 'workDate',
        title: 'اليوم',
        render: (row) => <TableDateCell value={row.workDate} />,
      },
      {
        key: 'status',
        title: 'الحالة',
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-normal',
              daySummaryStatusBadgeClass(row.status),
            )}
          >
            {daySummaryStatusLabel(row.status)}
          </Badge>
        ),
      },
    ];

    const visibleOptional = DAY_SUMMARY_COLUMN_OPTIONS
      .filter((option) => visibility[option.key])
      .map((option) => optionalColumns[option.key]);

    return [...pinned, ...visibleOptional];
  }, [onOvertimePayrollToggle, onRequestSettle, overtimePayrollBusyId, visibility]);
}
