'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
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
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Input } from '@/components/ui/input';

export function MovesLedgerReportPage() {
  const companyId = getInventoryCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [kind, setKind] = React.useState<'all' | WarehouseOperationKind>('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  React.useEffect(() => {
    setPage(1);
  }, [warehouseId, kind, dateFrom, dateTo]);

  const { data, isLoading, isError } = useInventoryLedger({
    companyId,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
    kind: kind === 'all' ? undefined : kind,
    search: search || undefined,
    page,
    limit: pageSize,
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

  const total = dateFrom || dateTo ? rows.length : (data?.pagination.total ?? 0);

  usePageHeaderActions(() => <FilterToggleButton />, []);

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="ابحث بالمرجع أو المنتج…"
          />
        }
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
          <div className="inv-date-filters">
            <Input
              type="date"
              className="inv-date-input h-8"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="من تاريخ"
            />
            <Input
              type="date"
              className="inv-date-input h-8"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="إلى تاريخ"
            />
          </div>
        }
      />
    ),
    [searchInput, warehouseId, kind, dateFrom, dateTo, warehouses],
  );

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
      hideOnMobile: true,
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
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.sourceDocument || row.partnerName || '—'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="سجل الحركات"
        descriptionAr="دفتر قيود ثابت — كل تصديق يكتب بنودًا غير قابلة للتعديل. التراجع يضيف قيود عكس."
        iconName="FileText"
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="subtle">قيود: {rows.length}</Badge>
        <Badge variant="success">
          وارد: {rows.filter((r) => r.quantityDelta > 0).reduce((s, r) => s + r.quantityDelta, 0)}
        </Badge>
        <Badge variant="destructive">
          صادر: {Math.abs(rows.filter((r) => r.quantityDelta < 0).reduce((s, r) => s + r.quantityDelta, 0))}
        </Badge>
      </div>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل سجل الحركات.</p> : null}

      <DirectoryPagedViews
        items={rows}
        loading={isLoading}
        serverPagination={{
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          setPage,
          setPageSize: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      >
        {(rowsPage) => (
          <DataTable
            variant="directory"
            className="inv-table-host"
            columns={columns}
            data={rowsPage}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyText="لا توجد قيود بعد — صدّق مستندًا لتسجيل أول حركة."
          />
        )}
      </DirectoryPagedViews>
    </div>
  );
}
