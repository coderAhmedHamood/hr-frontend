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
import type {
  WarehouseLocation,
  WarehouseOperationKind,
} from '@/features/inventory/domain/types/warehouse';
import { formatDateTime } from '@/shared/utils';
import {
  LocationRouteChips,
  WarehouseChip,
  WarehouseRouteChips,
} from '@/features/inventory/admin/operations/components/inventory-chips';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { DateRangeFilterTrigger, type DateRangeFilterValue } from '@/components/ui/date-range-filter-trigger';

/**
 * Each ledger row holds its own side of the movement; the counterpart is the
 * other side. A negative delta means the row *is* the source, a positive one
 * means it is the destination — so the route has to be read from the sign.
 */
function movementRoute(entry: InventoryLedgerEntry) {
  const isDestination = entry.quantityDelta >= 0;
  const counterpartWarehouseId =
    entry.counterpartWarehouseId && entry.counterpartWarehouseId !== entry.warehouseId
      ? entry.counterpartWarehouseId
      : undefined;
  return {
    crossWarehouse: Boolean(counterpartWarehouseId),
    fromWarehouseId: isDestination ? counterpartWarehouseId : entry.warehouseId,
    toWarehouseId: isDestination ? entry.warehouseId : counterpartWarehouseId,
    fromLocationId: isDestination ? entry.counterpartLocationId : entry.locationId,
    toLocationId: isDestination ? entry.locationId : entry.counterpartLocationId,
  };
}

function localDateBoundary(date: string, endOfDay = false): string | undefined {
  if (!date) return undefined;
  const value = new Date(`${date}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
}

function formatLocationFilterLabel(
  location: WarehouseLocation,
  warehouseLabel: string | undefined,
  includeWarehouse: boolean,
): string {
  const name = location.nameAr?.trim() || location.code;
  const code =
    location.code && name !== location.code ? ` · ${location.code}` : '';
  if (!includeWarehouse) return `${name}${code}`;
  const wh = warehouseLabel?.trim() || '—';
  return `${wh} · ${name}${code}`;
}

export function MovesLedgerReportPage() {
  const companyId = getInventoryCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [locationId, setLocationId] = React.useState('all');
  const [kind, setKind] = React.useState<'all' | WarehouseOperationKind>('all');
  const [dateRange, setDateRange] = React.useState<DateRangeFilterValue>({ from: '', to: '' });

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  React.useEffect(() => {
    setPage(1);
  }, [warehouseId, locationId, kind, dateRange]);

  // A location belongs to one warehouse — clear it if it no longer matches
  // the selected warehouse instead of silently filtering on a stale id.
  React.useEffect(() => {
    setLocationId('all');
  }, [warehouseId]);

  const { data, isLoading, isError } = useInventoryLedger({
    companyId,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
    locationId: locationId === 'all' ? undefined : locationId,
    kind: kind === 'all' ? undefined : kind,
    occurredAtFrom: localDateBoundary(dateRange.from),
    occurredAtTo: localDateBoundary(dateRange.to, true),
    search: search || undefined,
    page,
    limit: pageSize,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  // Unscoped — a cross-warehouse transfer's counterpart location can belong to
  // a warehouse other than the one selected in the filter, so the name lookup
  // needs every location, not just the filtered warehouse's.
  const { data: locationsData } = useWarehouseLocations({ companyId, limit: 500 });

  const warehouses = React.useMemo(() => warehousesData?.items ?? [], [warehousesData?.items]);
  const warehouseName = React.useMemo(
    () => new Map(warehouses.map((item) => [item.id, item.nameAr])),
    [warehouses],
  );
  const locations = React.useMemo(() => locationsData?.items ?? [], [locationsData?.items]);
  const locationName = React.useMemo(() => {
    const map = new Map(locations.map((item) => [item.id, item.nameAr || item.code]));
    return (id?: string) => (id ? (map.get(id) ?? id) : '—');
  }, [locations]);
  const scopedToWarehouse = warehouseId !== 'all';
  // Scoped to one warehouse when picked; otherwise every location is labeled
  // with its warehouse so duplicate names (e.g. several «داخلي») stay distinct.
  const locationOptions = React.useMemo(() => {
    const pool = scopedToWarehouse
      ? locations.filter((item) => item.warehouseId === warehouseId)
      : locations;
    return [...pool].sort((a, b) => {
      if (!scopedToWarehouse) {
        const whCmp = (warehouseName.get(a.warehouseId) ?? '').localeCompare(
          warehouseName.get(b.warehouseId) ?? '',
          'ar',
        );
        if (whCmp !== 0) return whCmp;
      }
      return (a.nameAr || a.code).localeCompare(b.nameAr || b.code, 'ar');
    });
  }, [locations, warehouseId, scopedToWarehouse, warehouseName]);

  const rows = data?.items ?? [];
  const total = data?.pagination.total ?? 0;

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
            id: 'location',
            value: locationId,
            onChange: setLocationId,
            placeholder: scopedToWarehouse ? 'كل المواقع' : 'الموقع (مع المستودع)',
            options: [
              { value: 'all', label: 'كل المواقع' },
              ...locationOptions.map((location) => ({
                value: location.id,
                label: formatLocationFilterLabel(
                  location,
                  warehouseName.get(location.warehouseId),
                  !scopedToWarehouse,
                ),
              })),
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
          <DateRangeFilterTrigger
            value={dateRange}
            onChange={setDateRange}
            placeholder="نطاق التاريخ"
            allowEmpty
          />
        }
      />
    ),
    [
      searchInput,
      warehouseId,
      locationId,
      locationOptions,
      scopedToWarehouse,
      warehouseName,
      kind,
      dateRange,
      warehouses,
    ],
  );

  const columns: ColumnDef<InventoryLedgerEntry>[] = [
    {
      key: 'date',
      title: 'التاريخ',
      sticky: 'start',
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {formatDateTime(row.occurredAt)}
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
      render: (row) => {
        const route = movementRoute(row);
        return route.crossWarehouse ? (
          <WarehouseRouteChips
            from={warehouseName.get(route.fromWarehouseId ?? '')}
            to={warehouseName.get(route.toWarehouseId ?? '')}
          />
        ) : (
          <WarehouseChip name={warehouseName.get(row.warehouseId)} />
        );
      },
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
      render: (row) => {
        const route = movementRoute(row);
        return (
          <LocationRouteChips
            from={route.fromLocationId ? locationName(route.fromLocationId) : null}
            to={route.toLocationId ? locationName(route.toLocationId) : null}
          />
        );
      },
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
        <Badge variant="subtle">قيود: {data?.summary.entries ?? total}</Badge>
        <Badge variant="success">وارد: {data?.summary.qtyIn ?? 0}</Badge>
        <Badge variant="destructive">صادر: {data?.summary.qtyOut ?? 0}</Badge>
        <Badge variant="subtle">الصافي: {data?.summary.net ?? 0}</Badge>
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
