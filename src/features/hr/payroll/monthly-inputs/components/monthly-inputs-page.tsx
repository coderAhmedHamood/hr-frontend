'use client';

import * as React from 'react';
import { Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { EntityFilterToolbar, type EntityFilterInlineSelect } from '@/components/ui/entity-filter-toolbar';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { PagedListViewport, PaginatedListShell } from '@/components/ui/paged-list';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import type { MonthlyInputResponseDto } from '@/features/hr/payroll/lib/api/monthly-inputs';
import {
  MONTHLY_INPUT_DIRECTION_LABELS,
  MONTHLY_INPUT_KIND_LABELS,
  MONTHLY_INPUT_KIND_ORDER,
  MONTHLY_INPUT_SOURCE_KIND_LABELS,
  MONTHLY_INPUT_SOURCE_KIND_ORDER,
  formatAmount,
  formatPayrollPeriodLabel,
} from '@/features/hr/payroll/monthly-inputs/constants/monthly-input-labels';
import { useMonthlyInputsDirectoryModel } from '@/features/hr/payroll/monthly-inputs/hooks/useMonthlyInputsDirectoryModel';
import { TableDateCell } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value ?? '—'}</span>
    </div>
  );
}

function MonthlyInputDetailDialog({
  row, open, onOpenChange,
}: {
  row: MonthlyInputResponseDto | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!row) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">تفاصيل المدخل الشهري</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pe-1">
          <DetailRow label="الموظف" value={row.employeeNameAr ?? row.employeeId} />
          <DetailRow label="الفترة" value={formatPayrollPeriodLabel(row.periodYear, row.periodMonth)} />
          <DetailRow label="نوع المدخل" value={MONTHLY_INPUT_KIND_LABELS[row.inputKind] ?? row.inputKind} />
          <DetailRow label="الاتجاه" value={MONTHLY_INPUT_DIRECTION_LABELS[row.direction] ?? row.direction} />
          <DetailRow label="المبلغ" value={formatAmount(row.amount, row.currency)} />
          <DetailRow label="المصدر" value={row.sourceKind ? (MONTHLY_INPUT_SOURCE_KIND_LABELS[row.sourceKind] ?? row.sourceKind) : '—'} />
          <DetailRow label="جدول المصدر" value={row.sourceTable} />
          <DetailRow label="معرّف المصدر" value={row.sourceId} />
          <DetailRow label="يؤثر على الراتب" value={row.affectsSalary ? 'نعم' : 'لا'} />
          <DetailRow label="ملاحظة" value={row.note} />
          <DetailRow label="أُنشئ" value={<TableDateCell value={row.createdAt} mode="datetime" />} />
          <DetailRow label="آخر تحديث" value={<TableDateCell value={row.updatedAt} mode="datetime" />} />
          <DetailRow label="أنشأه" value={row.createdBy} />
          <DetailRow label="حدّثه" value={row.updatedBy} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MonthlyInputsPage() {
  const {
    items, total, page, setPage, limit, setLimit, loading,
    filters, patchFilters, periodOptions, selectedEmpIds, setSelectedEmpIds,
    activeFilterCount, clearFilters,
  } = useMonthlyInputsDirectoryModel();

  const { employees: allEmployees, fetch: fetchEmployees } = useHREmployeeDirectoryStore();
  React.useEffect(() => {
    if (allEmployees.length === 0) void fetchEmployees();
  }, [allEmployees.length, fetchEmployees]);

  const empPickerList = React.useMemo(
    () => allEmployees.filter((e) => e.status === 'active').map((e) => ({ id: e.id, name: e.nameAr })),
    [allEmployees],
  );

  const [detailRow, setDetailRow] = React.useState<MonthlyInputResponseDto | null>(null);

  const inlineSelects = React.useMemo((): EntityFilterInlineSelect[] => [
    {
      id: 'period',
      value: filters.payrollPeriodId,
      onChange: (v) => patchFilters({ payrollPeriodId: v || 'all' }),
      placeholder: 'فترة الراتب',
      className: 'w-[10rem]',
      options: [
        { value: 'all', label: 'كل الفترات' },
        ...periodOptions.map((p) => ({ value: p.value, label: p.label })),
      ],
    },
    {
      id: 'inputKind',
      value: filters.inputKind,
      onChange: (v) => patchFilters({ inputKind: (v || 'all') as typeof filters.inputKind }),
      placeholder: 'نوع المدخل',
      className: 'w-[9.5rem]',
      options: [
        { value: 'all', label: 'كل الأنواع' },
        ...MONTHLY_INPUT_KIND_ORDER.map((k) => ({ value: k, label: MONTHLY_INPUT_KIND_LABELS[k] })),
      ],
    },
    {
      id: 'direction',
      value: filters.direction,
      onChange: (v) => patchFilters({ direction: (v || 'all') as typeof filters.direction }),
      placeholder: 'الاتجاه',
      className: 'w-[8rem]',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'addition', label: MONTHLY_INPUT_DIRECTION_LABELS.addition },
        { value: 'deduction', label: MONTHLY_INPUT_DIRECTION_LABELS.deduction },
      ],
    },
    {
      id: 'sourceKind',
      value: filters.sourceKind,
      onChange: (v) => patchFilters({ sourceKind: (v || 'all') as typeof filters.sourceKind }),
      placeholder: 'مصدر المدخل',
      className: 'w-[8.5rem]',
      options: [
        { value: 'all', label: 'كل المصادر' },
        ...MONTHLY_INPUT_SOURCE_KIND_ORDER.map((k) => ({ value: k, label: MONTHLY_INPUT_SOURCE_KIND_LABELS[k] })),
      ],
    },
    {
      id: 'affectsSalary',
      value: filters.affectsSalary,
      onChange: (v) => patchFilters({ affectsSalary: (v || 'all') as typeof filters.affectsSalary }),
      placeholder: 'يؤثر على الراتب',
      className: 'w-[9rem]',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'true', label: 'نعم' },
        { value: 'false', label: 'لا' },
      ],
    },
  ], [filters, patchFilters, periodOptions]);

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        inlineSelects={inlineSelects}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        onDateBoundsChange={() => {}}
      />
    ),
    [inlineSelects, empPickerList, selectedEmpIds, setSelectedEmpIds],
  );

  usePageHeaderActions(
    () => <FilterToggleButton activeFilterCount={activeFilterCount} />,
    [activeFilterCount],
  );

  const columns = React.useMemo((): ColumnDef<MonthlyInputResponseDto>[] => [
    {
      key: 'employee',
      title: 'الموظف',
      render: (row) => (
        <span className="font-medium">{row.employeeNameAr ?? '—'}</span>
      ),
    },
    {
      key: 'period',
      title: 'الفترة',
      hideOnMobile: true,
      render: (row) => formatPayrollPeriodLabel(row.periodYear, row.periodMonth),
    },
    {
      key: 'kind',
      title: 'نوع المدخل',
      render: (row) => MONTHLY_INPUT_KIND_LABELS[row.inputKind] ?? row.inputKind,
    },
    {
      key: 'direction',
      title: 'الاتجاه',
      render: (row) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-normal',
            row.direction === 'addition'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          {MONTHLY_INPUT_DIRECTION_LABELS[row.direction]}
        </Badge>
      ),
    },
    {
      key: 'amount',
      title: 'المبلغ',
      render: (row) => (
        <span className="font-mono tabular-nums" dir="ltr">
          {formatAmount(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: 'source',
      title: 'المصدر',
      hideOnMobile: true,
      render: (row) => row.sourceKind
        ? (MONTHLY_INPUT_SOURCE_KIND_LABELS[row.sourceKind] ?? row.sourceKind)
        : '—',
    },
    {
      key: 'affects',
      title: 'يؤثر على الراتب',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant="outline" className={cn('text-[10px] font-normal', row.affectsSalary ? 'border-primary/30 text-primary' : 'text-muted-foreground')}>
          {row.affectsSalary ? 'نعم' : 'لا'}
        </Badge>
      ),
    },
    {
      key: 'note',
      title: 'ملاحظة',
      hideOnMobile: true,
      className: 'max-w-[12rem]',
      render: (row) => (
        <span className="  text-muted-foreground text-xs">{row.note ?? '—'}</span>
      ),
    },
  ], []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SetPageTitle
        titleAr="مدخلات الرواتب الشهرية"
        descriptionAr="إضافات وخصومات شهرية مجمّعة لكل موظف ضمن فترة الراتب — عرض فقط."
        iconName="Receipt"
      />

      {activeFilterCount > 0 && (
        <div className="mb-3">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            مسح الفلاتر
          </Button>
        </div>
      )}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="لا توجد مدخلات"
          description="جرّب تغيير الفلاتر أو اختيار فترة راتب مختلفة."
        />
      ) : (
        <PagedListViewport>
          <PaginatedListShell
            pagination={{
              page,
              pageSize: limit,
              total,
              totalPages: Math.max(1, Math.ceil(total / limit)),
              setPage,
              setPageSize: setLimit,
            }}
          >
            <DataTable
              columns={columns}
              data={items}
              keyExtractor={(row) => row.id}
              loading={loading}
              onRowClick={(row) => setDetailRow(row)}
            />
          </PaginatedListShell>
        </PagedListViewport>
      )}

      <MonthlyInputDetailDialog
        row={detailRow}
        open={Boolean(detailRow)}
        onOpenChange={(v) => { if (!v) setDetailRow(null); }}
      />
    </div>
  );
}
