'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useInventoryLedger } from '@/features/inventory/admin/operations/hooks/use-inventory-ledger';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import {
  WAREHOUSE_OPERATION_KINDS,
  WAREHOUSE_OPERATION_KIND_META,
} from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { InventoryLedgerEntry } from '@/features/inventory/domain/types/inventory-ledger';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function MovesLedgerReportPage() {
  const companyId = getInventoryCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [kind, setKind] = React.useState<'all' | WarehouseOperationKind>('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useInventoryLedger({
    companyId,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
    kind: kind === 'all' ? undefined : kind,
    search: search || undefined,
    page: 1,
    limit: 500,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const { data: locationsData } = useWarehouseLocations({ companyId, limit: 500 });

  const warehouses = warehousesData?.items ?? [];
  const warehouseName = React.useMemo(
    () => new Map(warehouses.map((item) => [item.id, item.nameAr])),
    [warehouses],
  );
  const locationName = React.useMemo(() => {
    const map = new Map((locationsData?.items ?? []).map((item) => [item.id, item.nameAr || item.code]));
    return (id?: string) => (id ? (map.get(id) ?? id) : '—');
  }, [locationsData?.items]);

  const rows = React.useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((row) => {
      if (dateFrom && row.occurredAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && row.occurredAt.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [data?.items, dateFrom, dateTo]);

  const columns: ColumnDef<InventoryLedgerEntry>[] = [
    {
      key: 'date',
      title: 'التاريخ',
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {new Date(row.occurredAt).toLocaleString('ar-SA')}
        </span>
      ),
    },
    {
      key: 'reference',
      title: 'المرجع',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium" dir="ltr">
            {row.operationReference}
          </span>
          <span className="text-xs text-muted-foreground">
            {WAREHOUSE_OPERATION_KIND_META[row.kind].labelAr}
          </span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => <span className="text-sm">{warehouseName.get(row.warehouseId) ?? '—'}</span>,
    },
    {
      key: 'product',
      title: 'المنتج',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.productName}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.sku || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      title: 'الموقع',
      render: (row) => (
        <div className="flex flex-col text-sm">
          <span>{locationName(row.locationId)}</span>
          {row.counterpartLocationId ? (
            <span className="text-xs text-muted-foreground">
              مقابل: {locationName(row.counterpartLocationId)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'delta',
      title: 'التغيير',
      render: (row) => (
        <span
          className={
            row.quantityDelta >= 0
              ? 'font-semibold text-emerald-700 tabular-nums dark:text-emerald-400'
              : 'font-semibold text-rose-700 tabular-nums dark:text-rose-400'
          }
          dir="ltr"
        >
          {row.quantityDelta >= 0 ? `+${row.quantityDelta}` : row.quantityDelta}
        </span>
      ),
    },
    {
      key: 'source',
      title: 'المصدر',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.sourceDocument || row.partnerName || '—'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="سجل الحركات" iconName="FileText" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">سجل الحركات (Inventory Ledger)</h1>
        <p className="text-sm text-muted-foreground">
          دفتر قيود ثابت — كل تصديق يكتب بنودًا غير قابلة للتعديل. التراجع يضيف قيود عكس.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="subtle">قيود: {rows.length}</Badge>
        <Badge variant="success">
          وارد: {rows.filter((r) => r.quantityDelta > 0).reduce((s, r) => s + r.quantityDelta, 0)}
        </Badge>
        <Badge variant="destructive">
          صادر: {Math.abs(rows.filter((r) => r.quantityDelta < 0).reduce((s, r) => s + r.quantityDelta, 0))}
        </Badge>
      </div>

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث بالمرجع أو المنتج…"
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="h-10 w-[150px]" aria-label="المستودع">
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
              <SelectTrigger className="h-10 w-[150px]" aria-label="نوع الحركة">
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
        }
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل سجل الحركات.</p> : null}

      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText="لا توجد قيود بعد — صدّق مستندًا لتسجيل أول حركة."
      />
    </div>
  );
}
