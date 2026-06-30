'use client';

import * as React from 'react';
import { CalendarRange } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { PagedListViewport, PaginatedListShell } from '@/components/ui/paged-list';
import { TableDateCell } from '@/components/ui/table-cells';
import { EmptyState } from '@/components/ui/shared-dialogs';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/types/api/attendance-day-summaries';
import {
  daySummaryStatusBadgeClass,
  daySummaryStatusLabel,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-labels';
import { useDaySummariesDirectoryModel } from '@/features/hr/attendance/day-summaries/hooks/useDaySummariesDirectoryModel';
import { DaySummaryMetricCell } from '@/features/hr/attendance/day-summaries/components/day-summary-metric-cell';
import { DaySummarySettleButton } from '@/features/hr/attendance/day-summaries/components/day-summary-settle-button';
import { DaySummarySettleConfirmDialog } from '@/features/hr/attendance/day-summaries/components/day-summary-settle-confirm-dialog';
import { DaySummaryOvertimePayrollToggle } from '@/features/hr/attendance/day-summaries/components/day-summary-overtime-payroll-toggle';
import { buildSettleDaySummaryPayload } from '@/features/hr/attendance/day-summaries/utils/day-summary-settle';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';
import { formatDaySummaryMetric } from '@/features/hr/attendance/day-summaries/utils/day-summary-display';
import { computePunchSpanMinutes } from '@/features/hr/attendance/day-summaries/utils/day-summary-metrics';
import { RecomputeDaySummariesDialog } from '@/features/hr/attendance/daily/dialogs/recompute-day-summaries-dialog';
import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { cn } from '@/shared/utils';

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value ?? '—'}</span>
    </div>
  );
}

function DaySummaryDetailDialog({
  row,
  open,
  onOpenChange,
}: {
  row: DaySummaryResponseDto | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!row) return null;
  const statusLabel = daySummaryStatusLabel(row.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">تفاصيل ملخص الحضور</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pe-1">
          <DetailRow label="الموظف" value={row.employeeNameAr ?? '—'} />
          <DetailRow label="اليوم" value={<TableDateCell value={row.workDate} />} />
          <DetailRow label="الحالة" value={statusLabel} />
          <DetailRow label="بداية متوقعة" value={<TableDateCell value={row.expectedStartAt} mode="datetime" />} />
          <DetailRow label="نهاية متوقعة" value={<TableDateCell value={row.expectedEndAt} mode="datetime" />} />
          <DetailRow label="تسجيل حضور" value={<TableDateCell value={row.actualCheckInAt} mode="datetime" />} />
          <DetailRow label="تسجيل انصراف" value={<TableDateCell value={row.actualCheckOutAt} mode="datetime" />} />
          <DetailRow
            label="مدة الحضور (بصمة)"
            value={
              computePunchSpanMinutes(row) != null
                ? minutesToHHMM(computePunchSpanMinutes(row)!)
                : '—'
            }
          />
          <DetailRow label="متوقع" value={formatDaySummaryMetric(row, 'expected') ?? '—'} />
          <DetailRow label="فعلي" value={formatDaySummaryMetric(row, 'total') ?? '—'} />
          <DetailRow label="تأخير" value={formatDaySummaryMetric(row, 'late') ?? '00:00'} />
          <DetailRow label="انصراف مبكر" value={formatDaySummaryMetric(row, 'earlyLeave') ?? '00:00'} />
          <DetailRow label="إضافي" value={formatDaySummaryMetric(row, 'overtime') ?? '00:00'} />
          <DetailRow
            label="إضافي رواتب"
            value={
              row.overtimePayrollAllowed
                ? `مسموح (${formatDaySummaryMetric(row, 'overtime') ?? '00:00'})`
                : 'غير مسموح'
            }
          />
          <DetailRow
            label="تسوية"
            value={
              row.isSettled
                ? `تمت (${row.settledMinutes ?? 0} د)`
                : row.canSettle
                  ? 'يمكن التسوية'
                  : '—'
            }
          />
          <DetailRow label="تعديل يدوي" value={row.isManualOverride ? 'نعم' : 'لا'} />
          <DetailRow label="نهائي" value={row.isFinalized ? 'نعم' : 'لا'} />
          <DetailRow label="ملاحظات" value={row.notes} />
          <DetailRow label="آخر حساب" value={<TableDateCell value={row.computedAt} mode="datetime" />} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DaySummariesPage() {
  const companyId = useDefaultCompanyId() ?? '';
  const authUser = useAuthStore((s) => s.user);
  const updatedByActor = authUser?.id ?? undefined;
  const model = useDaySummariesDirectoryModel();
  const [detailRow, setDetailRow] = React.useState<DaySummaryResponseDto | null>(null);
  const [settleRow, setSettleRow] = React.useState<DaySummaryResponseDto | null>(null);
  const [settling, setSettling] = React.useState(false);
  const [overtimePayrollBusyId, setOvertimePayrollBusyId] = React.useState<string | null>(null);

  const handleSettleConfirm = React.useCallback(async () => {
    if (!settleRow) return;
    setSettling(true);
    try {
      await attendanceDaySummariesApi.settle(
        settleRow.id,
        buildSettleDaySummaryPayload(updatedByActor),
      );
      toast.success('تمت تسوية الحضور من الإضافي');
      setSettleRow(null);
      await model.reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'day-summaries.settle');
      toast.error(displayMessage);
    } finally {
      setSettling(false);
    }
  }, [model, settleRow, updatedByActor]);

  const handleOvertimePayrollToggle = React.useCallback(
    async (row: DaySummaryResponseDto, allowed: boolean) => {
      setOvertimePayrollBusyId(row.id);
      try {
        await attendanceDaySummariesApi.setOvertimePayrollAllowed(row.id, {
          allowed,
          ...(updatedByActor ? { updatedBy: updatedByActor } : {}),
        });
        toast.success(
          allowed ? 'تم السماح باحتساب الإضافي في الرواتب' : 'تم إلغاء السماح باحتساب الإضافي في الرواتب',
        );
        await model.reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'day-summaries.overtime-payroll');
        toast.error(displayMessage);
      } finally {
        setOvertimePayrollBusyId(null);
      }
    },
    [model, updatedByActor],
  );

  const columns = React.useMemo((): ColumnDef<DaySummaryResponseDto>[] => [
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
    {
      key: 'checkIn',
      title: 'حضور',
      hideOnMobile: true,
      render: (row) => <TableDateCell value={row.actualCheckInAt} mode="datetime" />,
    },
    {
      key: 'checkOut',
      title: 'انصراف',
      hideOnMobile: true,
      render: (row) => <TableDateCell value={row.actualCheckOutAt} mode="datetime" />,
    },
    {
      key: 'expected',
      title: 'متوقع',
      hideOnMobile: true,
      render: (row) => <DaySummaryMetricCell row={row} metric="expected" />,
    },
    {
      key: 'total',
      title: 'فعلي',
      render: (row) => <DaySummaryMetricCell row={row} metric="total" />,
    },
    {
      key: 'late',
      title: 'تأخير',
      render: (row) => (
        <DaySummaryMetricCell row={row} metric="late" emptyWhenZero tone="warn" />
      ),
    },
    {
      key: 'earlyLeave',
      title: 'انصراف مبكر',
      hideOnMobile: true,
      render: (row) => (
        <DaySummaryMetricCell row={row} metric="earlyLeave" emptyWhenZero tone="warn" />
      ),
    },
    {
      key: 'overtime',
      title: 'إضافي',
      render: (row) => (
        <DaySummaryMetricCell row={row} metric="overtime" emptyWhenZero tone="success" />
      ),
    },
    {
      key: 'manual',
      title: 'يدوي',
      hideOnMobile: true,
      render: (row) => (row.isManualOverride ? 'نعم' : '—'),
    },
    {
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
          onToggle={handleOvertimePayrollToggle}
        />
      ),
    },
    {
      key: 'settle',
      title: 'تسوية',
      isActions: true,
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <DaySummarySettleButton row={row} onRequestSettle={setSettleRow} />
      ),
    },
  ], [handleOvertimePayrollToggle, overtimePayrollBusyId, setSettleRow]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SetPageTitle
        titleAr="كشف الحضور"
        descriptionAr="متوقع والفعلي مع تأخير، انصراف مبكر، وإضافي من الخادم."
        iconName="CalendarRange"
      />

      {!model.loading && model.items.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="لا توجد ملخصات"
          description="غيّر نطاق التاريخ أو نفّظ «تحديث البيانات» لإعادة الحساب من الأحداث."
        />
      ) : (
        <PagedListViewport>
          <PaginatedListShell
            pagination={{
              page: model.page,
              pageSize: model.limit,
              total: model.total,
              totalPages: Math.max(1, Math.ceil(model.total / model.limit)),
              setPage: model.setPage,
              setPageSize: model.setLimit,
            }}
          >
            <DataTable
              columns={columns}
              data={model.items}
              keyExtractor={(row) => row.id}
              loading={model.loading}
              alwaysShowTable
              onRowClick={(row) => setDetailRow(row)}
            />
          </PaginatedListShell>
        </PagedListViewport>
      )}

      <DaySummaryDetailDialog
        row={detailRow}
        open={detailRow != null}
        onOpenChange={(v) => { if (!v) setDetailRow(null); }}
      />

      <DaySummarySettleConfirmDialog
        row={settleRow}
        open={settleRow != null}
        onOpenChange={(v) => { if (!v) setSettleRow(null); }}
        onConfirm={handleSettleConfirm}
        submitting={settling}
      />

      {companyId ? (
        <RecomputeDaySummariesDialog
          open={model.recomputeOpen}
          onOpenChange={model.setRecomputeOpen}
          companyId={companyId}
          defaultFrom={model.from}
          defaultTo={model.to}
          filterEmployeeIds={model.selectedEmpIds}
          allEmployees={model.allEmployees}
          onSuccess={model.reload}
        />
      ) : null}
    </div>
  );
}
