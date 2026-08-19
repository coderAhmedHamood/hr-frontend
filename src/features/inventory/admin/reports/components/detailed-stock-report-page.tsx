'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useLocationStockList } from '@/features/inventory/admin/hooks/use-product-on-hand';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import type { WarehouseLocationType } from '@/features/inventory/domain/types/warehouse';
import { Badge } from '@/components/ui/badge';
import { DataTable, usePagination, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Button } from '@/components/ui/button';

const LOCATION_TYPE_LABELS: Record<WarehouseLocationType, string> = {
  supplier: 'المورد',
  view: 'افتراضي',
  internal: 'داخلي',
  customer: 'العميل',
  inventory: 'خسارة المخزون',
  production: 'الإنتاج',
  transit: 'العابر',
};
type DetailedStockRow = {
  key: string;
  warehouseName: string;
  locationName: string;
  locationCode: string;
  locationType: WarehouseLocationType;
  productName: string;
  sku: string;
  variantLabel: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: string;
};

export function DetailedStockReportPage() {
  const companyId = getInventoryCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [locationType, setLocationType] = React.useState<'all' | WarehouseLocationType>('internal');
  const [hideZero, setHideZero] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: stockRows = [], isLoading, isError } = useLocationStockList({
    companyId,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
  });
  const { data: productsData } = useProducts({ companyId, page: 1, limit: 500 });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const { data: locationsData } = useWarehouseLocations({
    companyId,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
    limit: 500,
  });

  const products = productsData?.items ?? [];
  const warehouses = warehousesData?.items ?? [];
  const locations = locationsData?.items ?? [];

  const productById = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const warehouseById = React.useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);
  const locationById = React.useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

  const rows = React.useMemo(() => {
    const result: DetailedStockRow[] = [];
    for (const row of stockRows) {
      const location = locationById.get(row.locationId);
      const product = productById.get(row.productId);
      const warehouse = warehouseById.get(row.warehouseId);
      const variant = product?.variants?.find((item) => item.id === row.variantId);
      result.push({
        key: row.id,
        warehouseName: warehouse?.nameAr ?? '—',
        locationName: location?.nameAr ?? '—',
        locationCode: location?.code ?? '—',
        locationType: location?.locationType ?? 'internal',
        productName: product?.nameAr ?? row.productId,
        sku: variant?.sku || product?.sku || '—',
        variantLabel: variant?.nameAr ?? '—',
        quantity: row.quantity,
        reservedQuantity: row.reservedQuantity ?? 0,
        updatedAt: row.updatedAt,
      });
    }
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [stockRows, locationById, productById, warehouseById]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      if (hideZero && row.quantity === 0) return false;
      if (locationType !== 'all' && row.locationType !== locationType) return false;
      if (!q) return true;
      return (
        row.productName.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.warehouseName.toLowerCase().includes(q) ||
        row.locationName.toLowerCase().includes(q) ||
        row.locationCode.toLowerCase().includes(q)
      );
    });
  }, [rows, search, hideZero, locationType]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    slice: pagedRows,
    total,
  } = usePagination(filtered, DEFAULT_PAGE_SIZE);

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
            placeholder="ابحث بالمنتج أو الموقع…"
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
            id: 'locationType',
            value: locationType,
            onChange: (value) => setLocationType(value as typeof locationType),
            placeholder: 'كل الأنواع',
            options: [
              { value: 'all', label: 'كل الأنواع' },
              ...(Object.keys(LOCATION_TYPE_LABELS) as WarehouseLocationType[]).map((type) => ({
                value: type,
                label: LOCATION_TYPE_LABELS[type],
              })),
            ],
          },
        ]}
        trailingActions={
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setHideZero((prev) => !prev)}>
            {hideZero ? 'إخفاء الصفر: نعم' : 'إخفاء الصفر: لا'}
          </Button>
        }
      />
    ),
    [searchInput, warehouseId, locationType, hideZero, warehouses],
  );

  const columns: ColumnDef<DetailedStockRow>[] = [
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => <span className="text-sm">{row.warehouseName}</span>,
    },
    {
      key: 'location',
      title: 'الموقع',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.locationName}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.locationCode}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'نوع الموقع',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant="subtle">{LOCATION_TYPE_LABELS[row.locationType]}</Badge>
      ),
    },
    {
      key: 'product',
      title: 'المنتج',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.productName}</span>
          <span className="text-xs text-muted-foreground">
            {row.variantLabel !== '—' ? row.variantLabel : null}
            {row.variantLabel !== '—' ? ' · ' : null}
            <span dir="ltr">{row.sku}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'qty',
      title: 'On Hand',
      render: (row) => (
        <span className="font-semibold tabular-nums" dir="ltr">
          {row.quantity}
        </span>
      ),
    },
    {
      key: 'reserved',
      title: 'Reserved',
      hideOnMobile: true,
      render: (row) => (
        <span className="tabular-nums text-muted-foreground" dir="ltr">
          {row.reservedQuantity}
        </span>
      ),
    },
    {
      key: 'available',
      title: 'Available',
      render: (row) => (
        <span className="font-semibold tabular-nums" dir="ltr">
          {Math.max(0, row.quantity - row.reservedQuantity)}
        </span>
      ),
    },
    {
      key: 'updated',
      title: 'آخر تحديث',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.updatedAt).toLocaleString('ar-SA')}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="Detailed Stock"
        descriptionAr="كمية كل منتج في كل موقع تخزين — مستوى الصف التفصيلي للمخزون."
        iconName="ClipboardList"
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل المخزون التفصيلي.</p> : null}

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
            className="inv-table-host"
            columns={columns}
            data={rowsPage}
            keyExtractor={(row) => row.key}
            loading={isLoading}
            emptyText="لا توجد صفوف مخزون تفصيلي."
          />
        )}
      </DirectoryPagedViews>
    </div>
  );
}
