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
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { PagedListViewport, PaginatedListShell } from '@/components/ui/paged-list';
import { TableDateCell } from '@/components/ui/table-cells';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import {
  DAY_SUMMARY_STATUS_BADGE,
  DAY_SUMMARY_STATUS_LABELS,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-labels';
import { useDaySummariesDirectoryModel } from '@/features/hr/attendance/day-summaries/hooks/useDaySummariesDirectoryModel';
import { RecomputeDaySummariesDialog } from '@/features/hr/attendance/daily/dialogs/recompute-day-summaries-dialog';
import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { cn } from '@/shared/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
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
  const statusLabel = DAY_SUMMARY_STATUS_LABELS[row.status] ?? row.status;

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
          <DetailRow label="دقائق التأخير" value={minutesToHHMM(row.lateMinutes)} />
          <DetailRow label="انصراف مبكر" value={minutesToHHMM(row.earlyLeaveMinutes)} />
          <DetailRow label="ساعات العمل" value={minutesToHHMM(row.workedMinutes)} />
          <DetailRow label="إضافي" value={minutesToHHMM(row.overtimeMinutes)} />
          <DetailRow label="تعديل يدوي" value={row.isManualOverride ? 'نعم' : 'لا'} />
          <DetailRow label="نهائي" value={row.isFinalized ? 'نعم' : 'لا'} />
          <DetailRow label="ملاحظات" value={row.notes} />
          <DetailRow label="آخر حساب" value={<TableDateCell value={row.computedAt} mode="datetime" />} />
          <DetailRow label="أُنشئ" value={<TableDateCell value={row.createdAt} mode="datetime" />} />
          <DetailRow label="آخر تحديث" value={<TableDateCell value={row.updatedAt} mode="datetime" />} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DaySummariesPage() {
  const companyId = useDefaultCompanyId() ?? '';
  const model = useDaySummariesDirectoryModel();
  const [detailRow, setDetailRow] = React.useState<DaySummaryResponseDto | null>(null);

  usePageHeaderActions(
    () => <FilterToggleButton />,
    [],
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
            DAY_SUMMARY_STATUS_BADGE[row.status] ?? '',
          )}
        >
          {DAY_SUMMARY_STATUS_LABELS[row.status] ?? row.status}
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
      key: 'late',
      title: 'تأخير',
      hideOnMobile: true,
      render: (row) => minutesToHHMM(row.lateMinutes),
    },
    {
      key: 'worked',
      title: 'عمل',
      render: (row) => minutesToHHMM(row.workedMinutes),
    },
    {
      key: 'manual',
      title: 'يدوي',
      hideOnMobile: true,
      render: (row) => (row.isManualOverride ? 'نعم' : '—'),
    },
  ], []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SetPageTitle
        titleAr="ملخص الحضور اليومي"
        descriptionAr="سجلات الحضور المحسوبة لكل موظف — إعادة الحساب من الأحداث والورديات."
        iconName="CalendarRange"
      />

      {!model.loading && model.items.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="لا توجد ملخصات"
          description="غيّر نطاق التاريخ أو نفّذ «تحديث البيانات» لإعادة الحساب من الأحداث."
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
