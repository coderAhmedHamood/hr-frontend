'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseOperations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operations';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { WarehouseOperationDetailDialog } from '@/features/inventory/admin/operations/components/warehouse-operation-detail-dialog';
import { WAREHOUSE_OPERATION_STATUS_LABELS_AR } from '@/features/inventory/domain/constants/warehouse-operation-status';
import { REPLENISHMENT_SOURCE_DOCUMENT } from '@/features/ecommerce/admin/products/constants/replenishment';
import type { WarehouseOperation } from '@/features/inventory/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export { REPLENISHMENT_SOURCE_DOCUMENT };

export function isReplenishmentOperation(op: WarehouseOperation): boolean {
  if (op.kind === 'replenishment') return true;
  if (op.kind !== 'receipt') return false;
  const source = op.sourceDocument?.trim() ?? '';
  const notes = op.notes?.trim() ?? '';
  return source.includes('تجديد') || notes.includes('تجديد مخزون');
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productNameAr: string;
  onCreateRequest?: () => void;
};

function statusBadgeVariant(
  status: WarehouseOperation['status'],
): 'subtle' | 'warning' | 'success' | 'destructive' {
  if (status === 'ready') return 'warning';
  if (status === 'done') return 'success';
  if (status === 'cancelled') return 'destructive';
  return 'subtle';
}

export function ProductReplenishmentListDialog({
  open,
  onOpenChange,
  productId,
  productNameAr,
  onCreateRequest,
}: Props) {
  const companyId = getStorefrontCompanyId();
  const [selected, setSelected] = React.useState<WarehouseOperation | null>(null);

  const { data, isLoading } = useWarehouseOperations({
    companyId,
    productId,
    limit: 100,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const warehouseName = React.useMemo(() => {
    const map = new Map((warehousesData?.items ?? []).map((item) => [item.id, item.nameAr]));
    return (id: string) => map.get(id) ?? id;
  }, [warehousesData?.items]);

  const items = React.useMemo(
    () => (data?.items ?? []).filter(isReplenishmentOperation),
    [data?.items],
  );

  React.useEffect(() => {
    if (!selected) return;
    const fresh = items.find((item) => item.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [items, selected?.id]);

  React.useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-2xl sm:max-w-2xl')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <RefreshCw className="h-4 w-4 text-primary" />
              طلبات تجديد المخزون
            </DialogTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              طلبات التجديد الخاصة بـ «{productNameAr}» وحالاتها (مسودة → جاهز → منتهي). الكمية تُحدَّث بعد
              التصديق من المستودع.
            </p>
          </div>

          <div className={cn(dialogShellBodyClass, 'space-y-3')}>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">جاري التحميل…</p>
            ) : items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                لا توجد طلبات تجديد بعد. أنشئ طلبًا جديدًا ليظهر هنا مع حالته.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((op) => {
                  const qty = op.lines
                    .filter((line) => !line.productId || line.productId === productId)
                    .reduce((sum, line) => sum + (line.demandQuantity ?? line.quantity), 0);
                  return (
                    <li key={op.id}>
                      <button
                        type="button"
                        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-start transition-colors hover:bg-muted/25"
                        onClick={() => setSelected(op)}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground" dir="ltr">
                            {op.reference || 'بدون مرجع'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {warehouseName(op.warehouseId)} · الكمية المطلوبة: {qty} ·{' '}
                            {new Date(op.occurredAt).toLocaleString('ar-SA')}
                          </p>
                          {op.sourceDocument ? (
                            <p className="text-xs text-muted-foreground">{op.sourceDocument}</p>
                          ) : null}
                        </div>
                        <Badge variant={statusBadgeVariant(op.status)}>
                          {WAREHOUSE_OPERATION_STATUS_LABELS_AR[op.status]}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            {onCreateRequest ? (
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onCreateRequest();
                }}
              >
                طلب تجديد جديد
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WarehouseOperationDetailDialog
        open={Boolean(selected)}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
        operation={selected}
      />
    </>
  );
}
