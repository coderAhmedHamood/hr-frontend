'use client';

import * as React from 'react';
import { History } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseOperations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operations';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { WarehouseOperationDetailDialog } from '@/features/inventory/admin/operations/components/warehouse-operation-detail-dialog';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import { WAREHOUSE_OPERATION_STATUS_LABELS_AR } from '@/features/inventory/domain/constants/warehouse-operation-status';
import type {
  WarehouseLocation,
  WarehouseOperation,
  WarehouseOperationKind,
  WarehouseOperationStatus,
} from '@/features/inventory/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productNameAr: string;
};

type MoveRow = {
  key: string;
  operation: WarehouseOperation;
  occurredAt: string;
  reference: string;
  productLabel: string;
  fromLabel: string;
  toLabel: string;
  quantity: number;
  status: WarehouseOperationStatus;
  kind: WarehouseOperationKind;
};

function statusBadgeVariant(
  status: WarehouseOperationStatus,
): 'subtle' | 'warning' | 'success' | 'destructive' {
  if (status === 'ready') return 'warning';
  if (status === 'done') return 'success';
  if (status === 'cancelled') return 'destructive';
  return 'subtle';
}

function defaultPartnerLocation(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
  warehouseId: string,
): { from?: string; to?: string } {
  const inWarehouse = locations.filter((location) => location.warehouseId === warehouseId);
  const vendors =
    inWarehouse.find((location) => location.locationType === 'supplier')?.nameAr ?? 'الموردون';
  const customers =
    inWarehouse.find((location) => location.locationType === 'customer')?.nameAr ?? 'العملاء';
  const effect = WAREHOUSE_OPERATION_KIND_META[kind]?.stockEffect;
  if (effect === 'inbound') return { from: vendors };
  if (effect === 'outbound') return { to: customers };
  return {};
}

export function ProductStockMovesHistoryDialog({
  open,
  onOpenChange,
  productId,
  productNameAr,
}: Props) {
  const companyId = getStorefrontCompanyId();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | WarehouseOperationStatus>('all');
  const [selectedOp, setSelectedOp] = React.useState<WarehouseOperation | null>(null);

  const { data, isLoading } = useWarehouseOperations({
    companyId,
    productId,
    limit: 200,
  });
  const { data: locationsData } = useWarehouseLocations({
    companyId,
    limit: 500,
  });
  const locations = locationsData?.items ?? [];
  const locationName = React.useMemo(() => {
    const map = new Map(locations.map((item) => [item.id, item.nameAr || item.code]));
    return (id?: string) => (id ? (map.get(id) ?? id) : '');
  }, [locations]);

  const rows = React.useMemo(() => {
    const ops = data?.items ?? [];
    const flattened: MoveRow[] = [];
    for (const op of ops) {
      const defaults = defaultPartnerLocation(op.kind, locations, op.warehouseId);
      const productLines = op.lines.filter(
        (line) => !line.productId || line.productId === productId,
      );
      for (const line of productLines) {
        const qty = op.status === 'done' ? line.quantity : (line.demandQuantity ?? line.quantity);
        flattened.push({
          key: `${op.id}-${line.id}`,
          operation: op,
          occurredAt: op.occurredAt,
          reference: op.reference,
          productLabel: line.productName,
          fromLabel: locationName(line.fromLocationId) || defaults.from || '—',
          toLabel: locationName(line.toLocationId) || defaults.to || '—',
          quantity: qty,
          status: op.status,
          kind: op.kind,
        });
      }
    }
    return flattened.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [data?.items, locations, locationName, productId]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.reference.toLowerCase().includes(q) ||
        row.productLabel.toLowerCase().includes(q) ||
        row.fromLabel.toLowerCase().includes(q) ||
        row.toLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  React.useEffect(() => {
    if (!open) {
      setSearch('');
      setStatusFilter('all');
      setSelectedOp(null);
    }
  }, [open]);

  // Keep selected op fresh after status transitions
  React.useEffect(() => {
    if (!selectedOp) return;
    const fresh = (data?.items ?? []).find((item) => item.id === selectedOp.id);
    if (fresh) setSelectedOp(fresh);
  }, [data?.items, selectedOp?.id]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-5xl sm:max-w-5xl')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <History className="h-4 w-4 text-primary" />
              سجل الحركات · {productNameAr}
            </DialogTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              كل عمليات الاستلام والصرف والحركات الداخلية المرتبطة بهذا المنتج بعد دخولها للمستودع.
            </p>
          </div>

          <div className={cn(dialogShellBodyClass, 'space-y-4')}>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالمرجع أو المنتج أو الموقع…"
                className="max-w-sm"
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
              >
                <SelectTrigger className="w-40" aria-label="تصفية الحالة">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="ready">جاهز</SelectItem>
                  <SelectItem value="done">منتهي</SelectItem>
                  <SelectItem value="cancelled">ملغى</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{filtered.length} حركة</span>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">جاري التحميل…</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                لا توجد حركات مسجّلة لهذا المنتج بعد.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="px-3 py-2.5 text-start font-medium">التاريخ</th>
                      <th className="px-3 py-2.5 text-start font-medium">الرقم المرجعي</th>
                      <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
                      <th className="px-3 py-2.5 text-start font-medium">من</th>
                      <th className="px-3 py-2.5 text-start font-medium">إلى</th>
                      <th className="px-3 py-2.5 text-start font-medium">الكمية</th>
                      <th className="px-3 py-2.5 text-start font-medium">الوحدة</th>
                      <th className="px-3 py-2.5 text-start font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr
                        key={row.key}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/25"
                        onClick={() => setSelectedOp(row.operation)}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                          {new Date(row.occurredAt).toLocaleString('ar-SA', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-primary" dir="ltr">
                            {row.reference || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">{row.productLabel}</td>
                        <td className="px-3 py-2.5 text-muted-foreground" dir="ltr">
                          {row.fromLabel}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground" dir="ltr">
                          {row.toLabel}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2.5 tabular-nums font-medium',
                            row.kind === 'issue' || row.kind === 'scrap'
                              ? 'text-destructive'
                              : WAREHOUSE_OPERATION_KIND_META[row.kind]?.stockEffect === 'inbound'
                                ? 'text-success'
                                : '',
                          )}
                          dir="ltr"
                        >
                          {row.quantity.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">الوحدات</td>
                        <td className="px-3 py-2.5">
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {WAREHOUSE_OPERATION_STATUS_LABELS_AR[row.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WarehouseOperationDetailDialog
        open={Boolean(selectedOp)}
        onOpenChange={(next) => {
          if (!next) setSelectedOp(null);
        }}
        operation={selectedOp}
      />
    </>
  );
}
