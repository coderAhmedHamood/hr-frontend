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
import { ListSortMenu } from '@/components/ui/list-sort';
import { ListGroupMenu, type ListTotals } from '@/components/ui/list-group';
import { ListSavedViews } from '@/components/ui/list-saved-views';
import { GroupedDataTable } from '@/components/ui/grouped-data-table';
import {
  registerExportRows,
  visibleExportColumns,
  type RegisterExportColumn,
} from '@/components/pdf/lib/register-export-rows';
import { ListColumnsPicker } from '@/components/ui/list-columns-picker';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { ListFilterBar, type ListFilterInlineSelect } from '@/components/ui/list-filter-bar';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { PagedListViewport, PaginatedListShell } from '@/components/ui/paged-list';
import { EmptyState } from '@/components/ui/shared-dialogs';
import type { MonthlyInputResponseDto } from '@/features/hr/payroll/lib/api/monthly-inputs';
import {
  MONTHLY_INPUT_DIRECTION_LABELS,
  MONTHLY_INPUT_KIND_LABELS,
  MONTHLY_INPUT_KIND_ORDER,
  MONTHLY_INPUT_SOURCE_KIND_LABELS,
  MONTHLY_INPUT_SOURCE_KIND_ORDER,
  formatPayrollPeriodLabel,
} from '@/features/hr/payroll/monthly-inputs/constants/monthly-input-labels';
import { MoneyAmount } from '@/components/ui/sar-amount';
import { useMonthlyInputsDirectoryModel } from '@/features/hr/payroll/monthly-inputs/hooks/useMonthlyInputsDirectoryModel';
import { TableDateCell } from '@/components/ui/table-cells';
import { companyCurrencyCode } from '@/features/auth/lib/company-currency';
import { cn, formatMoneyDigits } from '@/shared/utils';
import { RegisterExportMenu } from '@/components/pdf/register-export-menu';
import { useLatestCallback } from '@/shared/hooks/use-latest-callback';
import { employeeStatusFilterLabelAr } from '@/features/hr/lib/employee-status-filter';

/**
 * A group's / the list's amounts: one direction → its sum; both → additions,
 * deductions and the net. Never a sum across two currencies.
 */
function formatInputsTotal(t: ListTotals): string {
  const { additions = 0, deductions = 0, net = 0, currencies = 0 } = t.sums;
  if (currencies > 1) return 'عملات متعددة — لا تُجمع';
  const fmt = (v: number) => formatMoneyDigits(v, 2);
  if (additions > 0 && deductions > 0) {
    return `إضافات ${fmt(additions)} · خصومات ${fmt(deductions)} · الصافي ${fmt(net)}`;
  }
  if (additions === 0 && deductions === 0) return '—';
  return fmt(additions > 0 ? additions : deductions);
}

const MONTHLY_INPUTS_EXPORT_COLUMNS: RegisterExportColumn<MonthlyInputResponseDto>[] = [
  { label: 'الموظف', kind: 'name', weight: 1.5, value: (row) => row.employeeNameAr ?? '—' },
  { key: 'period', label: 'الفترة', kind: 'status', value: (row) => formatPayrollPeriodLabel(row.periodYear, row.periodMonth) },
  {
    key: 'kind', label: 'نوع المدخل',
    kind: 'status',
    value: (row) => MONTHLY_INPUT_KIND_LABELS[row.inputKind] ?? row.inputKind,
  },
  {
    key: 'direction', label: 'الاتجاه',
    kind: 'status',
    value: (row) => MONTHLY_INPUT_DIRECTION_LABELS[row.direction] ?? row.direction,
  },
  {
    key: 'amount', label: 'المبلغ',
    kind: 'text',
    weight: 1.6,
    value: (row) => `${formatMoneyDigits(row.amount, 2)} ${row.currency || companyCurrencyCode()}`,
    total: formatInputsTotal,
  },
  {
    key: 'source', label: 'المصدر',
    kind: 'status',
    value: (row) => (row.sourceKind ? (MONTHLY_INPUT_SOURCE_KIND_LABELS[row.sourceKind] ?? row.sourceKind) : '—'),
  },
  { key: 'affects', label: 'يؤثر على الراتب', kind: 'status', value: (row) => (row.affectsSalary ? 'نعم' : 'لا') },
  { key: 'note', label: 'ملاحظة', kind: 'text', weight: 1.6, value: (row) => row.note ?? '—' },
];

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
          <DetailRow label="المبلغ" value={<MoneyAmount value={row.amount} currency={row.currency} />} />
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
    filters, patchFilters, periodOptions, loadPeriods, selectedEmpIds, setSelectedEmpIds,
    employeeStatus, setEmployeeStatus,
    empPickerEmployees, employeePickerLoading, loadEmployeePicker,
    activeFilterCount, clearFilters, fetchAllForExport, org, sort, group, grouped, stateKeys,
    columnVisibility,
  } = useMonthlyInputsDirectoryModel();
  const isColumnVisible = columnVisibility.isVisible;
  const exportColumns = React.useMemo(
    () => visibleExportColumns(MONTHLY_INPUTS_EXPORT_COLUMNS, columnVisibility.isVisible),
    [columnVisibility.isVisible],
  );

  const [detailRow, setDetailRow] = React.useState<MonthlyInputResponseDto | null>(null);

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => [
    {
      id: 'period',
      value: filters.payrollPeriodId,
      onChange: (v) => patchFilters({ payrollPeriodId: v || 'all' }),
      onOpen: loadPeriods,
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
    ...org.inlineSelects,
  ], [filters, patchFilters, periodOptions, loadPeriods, org.inlineSelects]);

  // Every active filter and the order, printed under the register's title.
  const exportSubtitleLines = React.useMemo(() => {
    const lines = [`حالة الموظفين: ${employeeStatusFilterLabelAr(employeeStatus)}`];
    if (filters.payrollPeriodId !== 'all') {
      lines.push(`الفترة: ${periodOptions.find((p) => p.value === filters.payrollPeriodId)?.label ?? '—'}`);
    }
    lines.push(...org.summaryLines);
    if (selectedEmpIds.size > 0) {
      const names = empPickerEmployees.filter((e) => selectedEmpIds.has(e.id)).map((e) => e.name);
      lines.push(names.length > 0 && names.length <= 5
        ? `الموظفون: ${names.join('، ')}`
        : `الموظفون: ${selectedEmpIds.size} موظف محدد`);
    }
    if (filters.inputKind !== 'all') lines.push(`نوع المدخل: ${MONTHLY_INPUT_KIND_LABELS[filters.inputKind] ?? filters.inputKind}`);
    if (filters.direction !== 'all') lines.push(`الاتجاه: ${MONTHLY_INPUT_DIRECTION_LABELS[filters.direction] ?? filters.direction}`);
    if (filters.sourceKind !== 'all') {
      lines.push(`المصدر: ${MONTHLY_INPUT_SOURCE_KIND_LABELS[filters.sourceKind] ?? filters.sourceKind}`);
    }
    if (filters.affectsSalary !== 'all') lines.push(`يؤثر على الراتب: ${filters.affectsSalary === 'true' ? 'نعم' : 'لا'}`);
    if (sort.label) lines.push(sort.label);
    if (group.label) lines.push(group.label);
    return lines;
  }, [
    employeeStatus, filters, periodOptions, org.summaryLines, selectedEmpIds, empPickerEmployees, sort.label,
    group.label,
  ]);

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        inlineSelects={inlineSelects}
        empPickerEmployees={empPickerEmployees}
        employeePickerLoading={employeePickerLoading}
        onEmployeePickerOpen={loadEmployeePicker}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        employeeStatus={employeeStatus}
        onEmployeeStatusChange={setEmployeeStatus}
        onDateBoundsChange={() => {}}
      />
    ),
    [inlineSelects, employeeStatus, empPickerEmployees, employeePickerLoading, loadEmployeePicker, selectedEmpIds, setSelectedEmpIds],
  );

  // Every filtered input (all pages) in the screen's order, grouped like the
  // screen, with each group's amounts and the grand total.
  const getExportRows = useLatestCallback(async () => {
    const data = await fetchAllForExport();
    if (!data) return [];
    return registerExportRows({
      columns: exportColumns,
      rows: data.items,
      total: data.summary.total,
      grouping: group.groupBy && group.option
        ? {
            fieldLabel: group.option.label,
            groups: group.sortGroups(data.summary.groups),
            labelOf: group.labelOf,
            groupKeyOf: (row) => row.groupKey,
          }
        : undefined,
    });
  });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <ListColumnsPicker model={columnVisibility} />
        <ListSortMenu model={sort} />
        <ListGroupMenu model={group} />
        <ListSavedViews storageKey={stateKeys.views} prefixes={stateKeys.prefixes} />
        <RegisterExportMenu
          title="سجل مدخلات الرواتب الشهرية"
          fileName="payroll-monthly-inputs"
          columns={exportColumns}
          getRows={getExportRows}
          subtitleLines={exportSubtitleLines}
          landscape
        />
      </div>
    ),
    [
      activeFilterCount, exportSubtitleLines, getExportRows, sort.sortKey,
      group.groupKey, JSON.stringify(group.group?.order), stateKeys.views, columnVisibility.hiddenKey,
    ],
  );

  const columns = React.useMemo((): ColumnDef<MonthlyInputResponseDto>[] => ([
    {
      key: 'employee',
      sortKey: 'employeeName',
      title: 'الموظف',
      render: (row) => (
        <span className="font-medium">{row.employeeNameAr ?? '—'}</span>
      ),
    },
    {
      key: 'period',
      sortKey: 'period',
      title: 'الفترة',
      hideOnMobile: true,
      render: (row) => formatPayrollPeriodLabel(row.periodYear, row.periodMonth),
    },
    {
      key: 'kind',
      sortKey: 'inputKind',
      title: 'نوع المدخل',
      render: (row) => MONTHLY_INPUT_KIND_LABELS[row.inputKind] ?? row.inputKind,
    },
    {
      key: 'direction',
      sortKey: 'direction',
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
      sortKey: 'amount',
      title: 'المبلغ',
      total: (t) => <span className="text-xs font-semibold">{formatInputsTotal(t)}</span>,
      render: (row) => (
        <MoneyAmount value={row.amount} currency={row.currency} className="font-mono" />
      ),
    },
    {
      key: 'source',
      sortKey: 'sourceKind',
      title: 'المصدر',
      hideOnMobile: true,
      render: (row) => row.sourceKind
        ? (MONTHLY_INPUT_SOURCE_KIND_LABELS[row.sourceKind] ?? row.sourceKind)
        : '—',
    },
    {
      key: 'affects',
      sortKey: 'affectsSalary',
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
  ] satisfies ColumnDef<MonthlyInputResponseDto>[]).filter((col) => isColumnVisible(col.key)), [isColumnVisible]);

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

      {group.groupBy ? (
        <PagedListViewport>
          <GroupedDataTable
            columns={columns}
            group={group}
            list={grouped}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => setDetailRow(row)}
            sort={sort.sort}
            onSort={sort.toggle}
            emptyText="لا توجد مدخلات ضمن الفلاتر الحالية"
          />
        </PagedListViewport>
      ) : !loading && items.length === 0 ? (
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
              sort={sort.sort}
              onSort={sort.toggle}
              totals={grouped.summary?.total}
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
