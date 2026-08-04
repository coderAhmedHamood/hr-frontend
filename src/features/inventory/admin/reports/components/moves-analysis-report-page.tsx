'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
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
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      <SetPageTitle titleAr="تحليل الحركات" iconName="BarChart3" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">تحليل الحركات</h1>
        <p className="text-sm text-muted-foreground">
          تجميع الحركات المنتهية حسب نوع المستند والمستودع (وارد / صادر / صافي).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="مستندات" value={summary.docs} />
        <SummaryCard label="بنود" value={summary.lines} />
        <SummaryCard label="وارد" value={summary.qtyIn} />
        <SummaryCard label="صادر" value={summary.qtyOut} />
        <SummaryCard label="صافي" value={summary.net} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-soft">
        <Select value={warehouseId} onValueChange={setWarehouseId}>
          <SelectTrigger className="h-10 w-[160px]" aria-label="المستودع">
            <SelectValue placeholder="المستودع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المستودعات</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
          <SelectTrigger className="h-10 w-[160px]" aria-label="نوع الحركة">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {WAREHOUSE_OPERATION_KINDS.map((item) => (
              <SelectItem key={item} value={item}>
                {WAREHOUSE_OPERATION_KIND_META[item].labelAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="h-10 w-[140px]"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="من تاريخ"
        />
        <Input
          type="date"
          className="h-10 w-[140px]"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="إلى تاريخ"
        />
      </div>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل تحليل الحركات.</p> : null}

      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.key}
        loading={isLoading}
        emptyText="لا توجد حركات منتهية للتحليل."
      />
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
