'use client';

import * as React from 'react';
import { ArrowLeftRight, PackageMinus, PackagePlus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
import { warehouseOperationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import { REPLENISHMENT_SOURCE_DOCUMENT } from '@/features/ecommerce/admin/products/constants/replenishment';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type VariantRow = ProductFormInput['variants'][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** عادة: replenishment | issue | internal | receipt */
  kind: WarehouseOperationKind;
  productId?: string | null;
  productNameAr: string;
  productSku: string;
  variants: VariantRow[];
  onCreated?: (warehouseId: string, kind: WarehouseOperationKind) => void;
};

type DraftLine = {
  key: string;
  nameAr: string;
  sku: string;
  variantId?: string;
  quantity: number;
};

function newLineId() {
  return `opl-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProductStockMoveRequestDialog({
  open,
  onOpenChange,
  kind,
  productId,
  productNameAr,
  productSku,
  variants,
  onCreated,
}: Props) {
  const companyId = getStorefrontCompanyId();
  const queryClient = useQueryClient();
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const warehouses = warehousesData?.items ?? [];

  const [warehouseId, setWarehouseId] = React.useState('');
  const [locationId, setLocationId] = React.useState('');
  const [toLocationId, setToLocationId] = React.useState('');
  const [lines, setLines] = React.useState<DraftLine[]>([]);
  const [saving, setSaving] = React.useState(false);

  const { data: locationsData } = useWarehouseLocations({
    companyId,
    warehouseId: warehouseId || undefined,
    limit: 200,
  });
  const locations = (locationsData?.items ?? []).filter(
    (location) => location.warehouseId === warehouseId && location.locationType === 'internal',
  );

  React.useEffect(() => {
    if (!open) return;
    const firstWarehouse = warehouses[0]?.id ?? '';
    setWarehouseId((prev) => prev || firstWarehouse);
    if (variants.length > 0) {
      setLines(
        variants.map((variant, index) => ({
          key: variant.id || `v-${index}`,
          nameAr: variant.nameAr,
          sku: variant.sku || productSku,
          variantId: variant.id,
          quantity: 0,
        })),
      );
    } else {
      setLines([
        {
          key: 'product',
          nameAr: productNameAr || 'المنتج',
          sku: productSku,
          quantity: 0,
        },
      ]);
    }
  }, [open, variants, productNameAr, productSku, warehouses]);

  React.useEffect(() => {
    if (!open || !warehouseId) return;
    const stockLoc =
      locations.find((location) => location.code?.toLowerCase().includes('stock')) ?? locations[0];
    setLocationId(stockLoc?.id ?? '');
    const second =
      locations.find((location) => location.id !== stockLoc?.id) ?? locations[0];
    setToLocationId(second?.id ?? stockLoc?.id ?? '');
  }, [open, warehouseId, locations]);

  const kindMeta = WAREHOUSE_OPERATION_KIND_META[kind];
  const stockEffect = kindMeta.stockEffect;
  const title = kindMeta.createLabel;
  const Icon =
    stockEffect === 'inbound' ? RefreshCw : stockEffect === 'outbound' ? PackageMinus : ArrowLeftRight;
  const hasQty = lines.some((line) => line.quantity > 0);

  async function handleSubmit() {
    if (!companyId) return;
    if (!productId) {
      toast.message('احفظ المنتج أولًا ثم أنشئ طلب الحركة.');
      return;
    }
    if (!warehouseId) {
      toast.error('اختر المستودع.');
      return;
    }
    if (!hasQty) {
      toast.error('أدخل كمية لسطر واحد على الأقل.');
      return;
    }

    if (stockEffect === 'move' && locationId && toLocationId && locationId === toLocationId) {
      toast.error('اختر موقعين مختلفين للحركة الداخلية.');
      return;
    }

    const opLines = lines
      .filter((line) => line.quantity > 0)
      .map((line) => ({
        id: newLineId(),
        productName: line.nameAr,
        sku: line.sku || undefined,
        productId,
        variantId: line.variantId,
        demandQuantity: line.quantity,
        quantity: line.quantity,
        ...(stockEffect === 'inbound'
          ? { toLocationId: locationId || undefined }
          : stockEffect === 'outbound'
            ? { fromLocationId: locationId || undefined }
            : {
                fromLocationId: locationId || undefined,
                toLocationId: toLocationId || undefined,
              }),
      }));

    setSaving(true);
    try {
      const created = await warehouseOperationsApi.create({
        companyId,
        warehouseId,
        kind,
        reference: `${kindMeta.refPrefix}-${Date.now().toString().slice(-6)}`,
        status: 'draft',
        occurredAt: new Date().toISOString(),
        sourceDocument:
          kind === 'replenishment' || kind === 'receipt'
            ? REPLENISHMENT_SOURCE_DOCUMENT
            : kind === 'issue'
              ? 'طلب توصيل يدوي'
              : 'حركة داخلية يدوية',
        notes: `طلب ${kindMeta.labelAr} للمنتج ${productNameAr}`,
        lines: opLines,
      });
      void queryClient.invalidateQueries({ queryKey: warehouseOperationsQueryKeys.root(companyId) });
      toast.success(`تم إنشاء ${kindMeta.createLabel} ${created.reference}`);
      onOpenChange(false);
      onCreated?.(warehouseId, kind);
    } catch {
      toast.error('تعذر إنشاء طلب الحركة.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-2xl sm:max-w-2xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
        </div>

        <div className={cn(dialogShellBodyClass, 'space-y-4')}>
          <p className="text-xs text-muted-foreground">
            لا تُحدَّث كمية المنتج مباشرة. يُنشأ طلب حركة في المستودع (مسودة) ثم يُعالج من شاشة العمليات.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>المستودع</Label>
              <Select value={warehouseId || undefined} onValueChange={setWarehouseId}>
                <SelectTrigger aria-label="المستودع">
                  <SelectValue placeholder="اختر مستودعًا" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                {stockEffect === 'inbound'
                  ? 'موقع الاستلام'
                  : stockEffect === 'outbound'
                    ? 'موقع الصرف'
                    : 'من موقع'}
              </Label>
              <Select
                value={locationId || undefined}
                onValueChange={setLocationId}
                disabled={!warehouseId || locations.length === 0}
              >
                <SelectTrigger aria-label="الموقع">
                  <SelectValue placeholder="اختياري" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {stockEffect === 'move' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>إلى موقع</Label>
                <Select
                  value={toLocationId || undefined}
                  onValueChange={setToLocationId}
                  disabled={!warehouseId || locations.length === 0}
                >
                  <SelectTrigger aria-label="إلى موقع">
                    <SelectValue placeholder="اختر الموقع الهدف" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="px-3 py-2.5 text-start font-medium">المنتج / المتغير</th>
                  <th className="px-3 py-2.5 text-start font-medium">الكمية المطلوبة</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.key} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{line.nameAr}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {line.sku}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        dir="ltr"
                        className="h-8 w-28"
                        value={line.quantity}
                        onChange={(event) => {
                          const quantity = Math.max(0, Number(event.target.value) || 0);
                          setLines((prev) =>
                            prev.map((item) => (item.key === line.key ? { ...item, quantity } : item)),
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving || !hasQty}>
            {saving ? 'جاري الإنشاء…' : kindMeta.createLabel}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StockMoveKindIcon({ kind }: { kind: WarehouseOperationKind }) {
  const effect = WAREHOUSE_OPERATION_KIND_META[kind].stockEffect;
  if (effect === 'inbound') return <PackagePlus className="h-4 w-4" />;
  if (effect === 'outbound') return <PackageMinus className="h-4 w-4" />;
  return <ArrowLeftRight className="h-4 w-4" />;
}
