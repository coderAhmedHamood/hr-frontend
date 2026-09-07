'use client';

import * as React from 'react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { ProductFormSection } from '@/features/ecommerce/admin/products/components/product-form-section';
import { ProductStatTile } from '@/features/ecommerce/admin/products/components/product-stat-tile';
import { BatchesTable } from '@/features/inventory/admin/batches/components/batches-table';
import { useInventoryBatches } from '@/features/inventory/admin/batches/hooks/use-inventory-batches';
import { batchExpiryState } from '@/features/inventory/admin/batches/lib/batch-expiry';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import type {
  InventoryBatchAvailability,
  InventoryBatchSort,
} from '@/features/inventory/domain/types/inventory-batch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoneyDigits } from '@/shared/utils';

const ALL = 'all';
const PRODUCT_BATCH_LIMIT = 200;

type Props = {
  productId?: string | null;
};

function qty(value: number): string {
  return formatMoneyDigits(value, Number.isInteger(value) ? 0 : 2);
}

/**
 * Traceability for one product: which layers it entered stock through, what is
 * left in each, and where. Read-only — layers come from posted operations.
 */
export function ProductBatchesTab({ productId }: Props) {
  const companyId = getStorefrontCompanyId();
  const [availability, setAvailability] = React.useState<InventoryBatchAvailability>('available');
  const [warehouseId, setWarehouseId] = React.useState(ALL);
  const [variantId, setVariantId] = React.useState(ALL);
  const [sort, setSort] = React.useState<InventoryBatchSort>('oldest');

  const { data, isLoading, isError } = useInventoryBatches(
    {
      companyId,
      productId: productId ?? undefined,
      variantId: variantId === ALL ? undefined : variantId,
      warehouseId: warehouseId === ALL ? undefined : warehouseId,
      availability,
      sort,
      limit: PRODUCT_BATCH_LIMIT,
    },
    { enabled: Boolean(productId) },
  );
  const { data: warehousesData } = useWarehouses(
    { companyId, limit: 100 },
    { enabled: Boolean(productId) },
  );

  const rows = React.useMemo(() => data?.items ?? [], [data?.items]);
  const summary = data?.summary;

  // Variant options come from the layers themselves, so the filter only ever
  // offers variants this product actually has stock history for.
  const variantOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.variantId) {
        map.set(row.variantId, row.variantName || row.variantSku || row.variantId);
      }
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [rows]);

  const expiringSoon = React.useMemo(
    () => rows.filter((row) => row.isAvailable && batchExpiryState(row.expiryDate) === 'soon').length,
    [rows],
  );

  if (!productId) {
    return (
      <ProductFormSection
        title="الدفعات"
        description="احفظ المنتج أولًا، ثم صدّق مستند استلام لتُنشأ أول دفعة."
      >
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          لا توجد دفعات بعد.
        </p>
      </ProductFormSection>
    );
  }

  return (
    <div className="space-y-4">
      <ProductFormSection
        title="دفعات هذا المنتج"
        description="كل دفعة طبقة كمية دخلت المخزون بحركة استلام أو تحويل، ويُصرف منها بترتيب FIFO/LIFO/FEFO حسب إعدادات المخزون."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <ProductStatTile
            size="lg"
            label="دفعات متوفرة"
            value={isLoading ? '…' : (summary?.availableBatches ?? 0)}
          />
          <ProductStatTile
            size="lg"
            accent
            label="إجمالي المتبقي"
            value={isLoading ? '…' : qty(summary?.remaining ?? 0)}
          />
          <ProductStatTile
            size="lg"
            label="إجمالي المصروف"
            value={isLoading ? '…' : qty(summary?.consumed ?? 0)}
          />
        </div>

        {summary?.expiredBatches || expiringSoon ? (
          <div className="flex flex-wrap gap-2">
            {summary?.expiredBatches ? (
              <Badge variant="destructive">منتهية الصلاحية: {summary.expiredBatches}</Badge>
            ) : null}
            {expiringSoon ? (
              <Badge variant="warning">قاربت الانتهاء: {expiringSoon}</Badge>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={availability}
            onValueChange={(value) => setAvailability(value as InventoryBatchAvailability)}
          >
            <SelectTrigger className="w-44" aria-label="تصفية التوفر">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">دفعات متوفرة</SelectItem>
              <SelectItem value="depleted">دفعات مستنفدة</SelectItem>
              <SelectItem value="all">كل الدفعات</SelectItem>
            </SelectContent>
          </Select>

          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-44" aria-label="تصفية المستودع">
              <SelectValue placeholder="كل المستودعات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل المستودعات</SelectItem>
              {(warehousesData?.items ?? []).map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {variantOptions.length > 0 || variantId !== ALL ? (
            <Select value={variantId} onValueChange={setVariantId}>
              <SelectTrigger className="w-44" aria-label="تصفية المتغير">
                <SelectValue placeholder="كل المتغيرات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>كل المتغيرات</SelectItem>
                {variantOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select value={sort} onValueChange={(value) => setSort(value as InventoryBatchSort)}>
            <SelectTrigger className="w-48" aria-label="ترتيب الدفعات">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oldest">الأقدم دخولًا (FIFO)</SelectItem>
              <SelectItem value="newest">الأحدث دخولًا</SelectItem>
              <SelectItem value="expiry">الأقرب انتهاءً (FEFO)</SelectItem>
              <SelectItem value="remaining">الأكبر كمية متبقية</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">
            {summary?.batches ?? rows.length} دفعة
          </span>
        </div>

        {isError ? (
          <p className="text-sm text-destructive">تعذر تحميل دفعات هذا المنتج.</p>
        ) : null}

        <BatchesTable
          rows={rows}
          loading={isLoading}
          hideProduct
          emptyText={
            availability === 'depleted'
              ? 'لا توجد دفعات مستنفدة لهذا المنتج.'
              : 'لا توجد دفعات لهذا المنتج — صدّق مستند استلام لتُنشأ أول دفعة.'
          }
        />

        {data && data.pagination.total > rows.length ? (
          <p className="text-xs text-muted-foreground">
            يتم عرض أحدث {rows.length} دفعة من {data.pagination.total}. استخدم تقرير الدفعات لعرض الكل.
          </p>
        ) : null}
      </ProductFormSection>
    </div>
  );
}
