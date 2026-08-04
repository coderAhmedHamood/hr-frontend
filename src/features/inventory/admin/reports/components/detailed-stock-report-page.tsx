'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useLocationStockList } from '@/features/inventory/admin/hooks/use-product-on-hand';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import type { WarehouseLocationType } from '@/features/inventory/domain/types/warehouse';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.updatedAt).toLocaleString('ar-SA')}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="Detailed Stock" iconName="ClipboardList" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">المخزون التفصيلي</h1>
        <p className="text-sm text-muted-foreground">
          كمية كل منتج في كل موقع تخزين — مستوى الصف التفصيلي للمخزون.
        </p>
      </div>

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث بالمنتج أو الموقع…"
        filters={
          <div className="flex flex-wrap items-center gap-2">
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
            <Select
              value={locationType}
              onValueChange={(value) => setLocationType(value as typeof locationType)}
            >
              <SelectTrigger className="h-10 w-[150px]" aria-label="نوع الموقع">
                <SelectValue placeholder="نوع الموقع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {(Object.keys(LOCATION_TYPE_LABELS) as WarehouseLocationType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {LOCATION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setHideZero((prev) => !prev)}
              className="h-10 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {hideZero ? 'إخفاء الصفر: نعم' : 'إخفاء الصفر: لا'}
            </button>
          </div>
        }
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل المخزون التفصيلي.</p> : null}

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.key}
        loading={isLoading}
        emptyText="لا توجد صفوف مخزون تفصيلي."
      />
    </div>
  );
}
