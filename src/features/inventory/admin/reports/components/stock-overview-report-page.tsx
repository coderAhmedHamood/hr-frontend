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
import { Badge } from '@/components/ui/badge';
import { DataTable, usePagination, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';

type StockOverviewRow = {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  trackInventory: boolean;
  onHand: number;
  reserved: number;
  available: number;
  warehouseCount: number;
  locationCount: number;
  lowStockThreshold: number;
  isLow: boolean;
};

export function StockOverviewReportPage() {
  const companyId = getInventoryCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [stockFilter, setStockFilter] = React.useState<'all' | 'in_stock' | 'low' | 'out'>('all');

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: stockRows = [], isLoading: stockLoading, isError: stockError } = useLocationStockList({
    companyId,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
  });
  const { data: productsData, isLoading: productsLoading } = useProducts({
    companyId,
    page: 1,
    limit: 500,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const { data: locationsData } = useWarehouseLocations({ companyId, limit: 500 });

  const products = productsData?.items ?? [];
  const warehouses = warehousesData?.items ?? [];
  const locations = locationsData?.items ?? [];

  const internalLocationIds = React.useMemo(
    () =>
      new Set(
        locations.filter((location) => location.locationType === 'internal').map((location) => location.id),
      ),
    [locations],
  );

  const rows = React.useMemo(() => {
    const byProduct = new Map<
      string,
      { onHand: number; reserved: number; warehouses: Set<string>; locations: Set<string> }
    >();

    for (const row of stockRows) {
      if (!internalLocationIds.has(row.locationId)) continue;
      let agg = byProduct.get(row.productId);
      if (!agg) {
        agg = { onHand: 0, reserved: 0, warehouses: new Set(), locations: new Set() };
        byProduct.set(row.productId, agg);
      }
      agg.onHand += row.quantity;
      agg.reserved += row.reservedQuantity ?? 0;
      agg.warehouses.add(row.warehouseId);
      agg.locations.add(row.locationId);
    }

    const result: StockOverviewRow[] = products.map((product) => {
      const agg = byProduct.get(product.id);
      const onHand = agg?.onHand ?? 0;
      const reserved = agg?.reserved ?? 0;
      const available = Math.max(0, onHand - reserved);
      const threshold = product.inventory.lowStockThreshold ?? 0;
      return {
        key: product.id,
        productId: product.id,
        productName: product.nameAr,
        sku: product.sku,
        trackInventory: product.inventory.trackInventory,
        onHand,
        reserved,
        available,
        warehouseCount: agg?.warehouses.size ?? 0,
        locationCount: agg?.locations.size ?? 0,
        lowStockThreshold: threshold,
        isLow: product.inventory.trackInventory && threshold > 0 && available > 0 && available <= threshold,
      };
    });

    return result;
  }, [stockRows, products, internalLocationIds]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      if (stockFilter === 'in_stock' && row.available <= 0) return false;
      if (stockFilter === 'out' && row.available !== 0) return false;
      if (stockFilter === 'low' && !row.isLow) return false;
      if (!q) return true;
      return row.productName.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q);
    });
  }, [rows, search, stockFilter]);

  const totals = React.useMemo(() => {
    const onHand = filtered.reduce((sum, row) => sum + row.onHand, 0);
    const low = filtered.filter((row) => row.isLow).length;
    const out = filtered.filter((row) => row.onHand <= 0 && row.trackInventory).length;
    return { onHand, low, out, products: filtered.length };
  }, [filtered]);

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
            placeholder="ابحث بالمنتج أو SKU…"
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
            id: 'stock',
            value: stockFilter,
            onChange: (value) => setStockFilter(value as typeof stockFilter),
            placeholder: 'كل الحالات',
            options: [
              { value: 'all', label: 'كل الحالات' },
              { value: 'in_stock', label: 'متوفر' },
              { value: 'low', label: 'منخفض' },
              { value: 'out', label: 'نفد' },
            ],
          },
        ]}
      />
    ),
    [searchInput, warehouseId, stockFilter, warehouses],
  );

  const columns: ColumnDef<StockOverviewRow>[] = [
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
      key: 'onHand',
      title: 'On Hand',
      render: (row) => (
        <span className="font-medium tabular-nums" dir="ltr">
          {row.onHand}
        </span>
      ),
    },
    {
      key: 'reserved',
      title: 'Reserved',
      render: (row) => (
        <span className="tabular-nums text-muted-foreground" dir="ltr">
          {row.reserved}
        </span>
      ),
    },
    {
      key: 'available',
      title: 'Available',
      render: (row) => (
        <span className="font-semibold tabular-nums" dir="ltr">
          {row.available}
        </span>
      ),
    },
    {
      key: 'warehouses',
      title: 'مستودعات',
      render: (row) => <span className="tabular-nums">{row.warehouseCount}</span>,
    },
    {
      key: 'locations',
      title: 'مواقع',
      render: (row) => <span className="tabular-nums">{row.locationCount}</span>,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => {
        if (!row.trackInventory) return <Badge variant="subtle">بدون تتبع</Badge>;
        if (row.available <= 0) return <Badge variant="destructive">نفد</Badge>;
        if (row.isLow) return <Badge variant="warning">منخفض</Badge>;
        return <Badge variant="success">متوفر</Badge>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="المخزون"
        descriptionAr="ملخص الكميات المتاحة لكل منتج من مواقع التخزين الداخلية."
        iconName="Package"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="منتجات" value={totals.products} />
        <SummaryCard label="إجمالي الكمية" value={totals.onHand} />
        <SummaryCard label="منخفض المخزون" value={totals.low} />
        <SummaryCard label="نفد" value={totals.out} />
      </div>

      {stockError ? <p className="text-sm text-destructive">تعذر تحميل بيانات المخزون.</p> : null}

      <DirectoryPagedViews
        items={pagedRows}
        loading={stockLoading || productsLoading}
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
            loading={stockLoading || productsLoading}
            emptyText="لا توجد بيانات مخزون."
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
