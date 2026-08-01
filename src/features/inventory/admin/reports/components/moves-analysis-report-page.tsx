'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useWarehouseOperations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operations';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import {
  aggregateMovesByKindAndWarehouse,
  flattenOperationsToMoveRows,
  type MovesAnalysisRow,
} from '@/features/inventory/admin/reports/lib/report-moves';
import {
  WAREHOUSE_OPERATION_KINDS,
  WAREHOUSE_OPERATION_KIND_META,
} from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { DataTable, usePagination, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { Input } from '@/components/ui/input';

export function MovesAnalysisReportPage() {
  const companyId = getInventoryCompanyId();
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [kind, setKind] = React.useState<'all' | WarehouseOperationKind>('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const { data, isLoading, isError } = useWarehouseOperations({
    companyId,
    all: true,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
    kind: kind === 'all' ? undefined : kind,
    status: 'done',
    page: 1,
    limit: 500,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const { data: locationsData } = useWarehouseLocations({ companyId, limit: 500 });

  const warehouses = warehousesData?.items ?? [];
  const locations = locationsData?.items ?? [];
  const warehouseName = React.useMemo(
    () => new Map(warehouses.map((item) => [item.id, item.nameAr])),
    [warehouses],
  );
  const locationName = React.useCallback((id?: string) => id ?? '', []);

  const rows = React.useMemo(() => {
    const ledger = flattenOperationsToMoveRows(data?.items ?? [], locations, locationName);
    const dated = ledger.filter((row) => {
      if (dateFrom && row.occurredAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && row.occurredAt.slice(0, 10) > dateTo) return false;
      return true;
    });
    return aggregateMovesByKindAndWarehouse(dated);
  }, [data?.items, locations, locationName, dateFrom, dateTo]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    slice: pagedRows,
    total,
  } = usePagination(rows, DEFAULT_PAGE_SIZE);

  usePageHeaderActions(() => <FilterToggleButton />, []);

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        inlineSelects={[
          {
            id: 'warehouse',
            value: warehouseId,
            onChange: setWarehouseId,
            placeholder: 'كل المستودعات',
            options: [
              { value: 'all', label: 'كل المستودعات' },
              ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.nameAr })),
            ],
          },
          {
            id: 'kind',
            value: kind,
            onChange: (value) => setKind(value as typeof kind),
            placeholder: 'كل الأنواع',
            options: [
              { value: 'all', label: 'كل الأنواع' },
              ...WAREHOUSE_OPERATION_KINDS.map((item) => ({
                value: item,
                label: WAREHOUSE_OPERATION_KIND_META[item].labelAr,
              })),
            ],
          },
        ]}
        trailingActions={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-8 w-[140px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="من تاريخ"
            />
            <Input
              type="date"
              className="h-8 w-[140px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="إلى تاريخ"
            />
          </div>
        }
      />
    ),
    [warehouseId, kind, dateFrom, dateTo, warehouses],
  );

  const summary = React.useMemo(() => {
    return {
      docs: rows.reduce((sum, row) => sum + row.operationCount, 0),
      lines: rows.reduce((sum, row) => sum + row.lineCount, 0),
      qtyIn: rows.reduce((sum, row) => sum + row.qtyIn, 0),
      qtyOut: rows.reduce((sum, row) => sum + row.qtyOut, 0),
      net: rows.reduce((sum, row) => sum + row.netQty, 0),
    };
  }, [rows]);

  const columns: ColumnDef<MovesAnalysisRow>[] = [
    {
      key: 'kind',
      title: 'نوع الحركة',
      render: (row) => (
        <span className="font-medium">{WAREHOUSE_OPERATION_KIND_META[row.kind].labelAr}</span>
      ),
    },
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => <span className="text-sm">{warehouseName.get(row.warehouseId) ?? '—'}</span>,
    },
    {
      key: 'docs',
      title: 'المستندات',
      render: (row) => <span className="tabular-nums">{row.operationCount}</span>,
    },
    {
      key: 'lines',
      title: 'البنود',
      render: (row) => <span className="tabular-nums">{row.lineCount}</span>,
    },
    {
      key: 'in',
      title: 'وارد',
      render: (row) => (
        <span className="font-medium text-emerald-700 tabular-nums dark:text-emerald-400" dir="ltr">
          {row.qtyIn}
        </span>
      ),
    },
    {
      key: 'out',
      title: 'صادر',
      render: (row) => (
        <span className="font-medium text-rose-700 tabular-nums dark:text-rose-400" dir="ltr">
          {row.qtyOut}
        </span>
      ),
    },
    {
      key: 'net',
      title: 'صافي',
      render: (row) => (
        <span className="font-semibold tabular-nums" dir="ltr">
          {row.netQty}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="تحليل الحركات"
        descriptionAr="تجميع الحركات المنتهية حسب نوع المستند والمستودع (وارد / صادر / صافي)."
        iconName="BarChart3"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="مستندات" value={summary.docs} />
        <SummaryCard label="بنود" value={summary.lines} />
        <SummaryCard label="وارد" value={summary.qtyIn} />
        <SummaryCard label="صادر" value={summary.qtyOut} />
        <SummaryCard label="صافي" value={summary.net} />
      </div>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل تحليل الحركات.</p> : null}

      <DirectoryPagedViews
        items={pagedRows}
        loading={isLoading}
        serverPagination={{
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          setPage,
          setPageSize,
        }}
      >
        {(rowsPage) => (
          <DataTable
            variant="directory"
            alwaysShowTable
            columns={columns}
            data={rowsPage}
            keyExtractor={(row) => row.key}
            loading={isLoading}
            emptyText="لا توجد حركات منتهية للتحليل."
          />
        )}
      </DirectoryPagedViews>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums" dir="ltr">
        {value}
      </p>
    </div>
  );
}
