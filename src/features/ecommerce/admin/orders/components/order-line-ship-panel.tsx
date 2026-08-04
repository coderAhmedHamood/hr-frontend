'use client';

import * as React from 'react';
import { Check, Plus, X } from 'lucide-react';
import {
  sumAllocationQty,
  validateAllocations,
} from '@/features/ecommerce/admin/orders/lib/allocation-utils';
import {
  useOrderFulfillmentMutations,
  useProductStockAvailability,
} from '@/features/ecommerce/admin/orders/hooks/use-orders';
import type { OrderLineItem } from '@/features/ecommerce/domain/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

type DraftRow = {
  key: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
};

type Props = {
  companyId: string;
  orderId: string;
  line: OrderLineItem;
};

function toDraftRows(line: OrderLineItem): DraftRow[] {
  if (line.allocations.length === 0) {
    return [{ key: 'row-1', warehouseId: '', locationId: '', quantity: line.quantity }];
  }
  return line.allocations.map((allocation, index) => ({
    key: allocation.id || `row-${index}`,
    warehouseId: allocation.warehouseId,
    locationId: allocation.locationId,
    quantity: allocation.quantity,
  }));
}

export function OrderLineShipPanel({ companyId, orderId, line }: Props) {
  const { data: availability = [], isLoading } = useProductStockAvailability(
    companyId,
    line.productId,
    true,
  );
  const { saveAllocations, shipLine } = useOrderFulfillmentMutations(companyId);
  const [open, setOpen] = React.useState(line.shipStatus !== 'shipped');
  const [multi, setMulti] = React.useState(line.allocations.length > 1);
  const [rows, setRows] = React.useState<DraftRow[]>(() => toDraftRows(line));
  const [showAvailability, setShowAvailability] = React.useState(false);

  React.useEffect(() => {
    setRows(toDraftRows(line));
    setMulti(line.allocations.length > 1);
  }, [line]);

  const availableByLocation = React.useMemo(
    () =>
      Object.fromEntries(
        availability.map((row) => [row.locationId, row.availableQuantity ?? row.quantity]),
      ),
    [availability],
  );

  const total = sumAllocationQty(rows);
  const validation = validateAllocations(
    line.quantity,
    rows.map((row) => ({
      warehouseId: row.warehouseId,
      locationId: row.locationId,
      quantity: row.quantity,
    })),
    availableByLocation,
  );

  const assignedQty = sumAllocationQty(line.allocations);
  const progressLabel = `${assignedQty}/${line.quantity}`;
  const isShipped = line.shipStatus === 'shipped';
  const isSaving = saveAllocations.isPending || shipLine.isPending;

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (patch.locationId) {
          const found = availability.find((item) => item.locationId === patch.locationId);
          if (found) next.warehouseId = found.warehouseId;
        }
        return next;
      }),
    );
  }

  function setMode(nextMulti: boolean) {
    setMulti(nextMulti);
    if (!nextMulti) {
      setRows((prev) => {
        const first = prev[0] ?? { key: 'row-1', warehouseId: '', locationId: '', quantity: line.quantity };
        return [{ ...first, quantity: line.quantity, key: 'row-1' }];
      });
    }
  }

  async function onSave() {
    if (!validation.ok) return;
    await saveAllocations.mutateAsync({
      orderId,
      input: {
        productId: line.productId,
        allocations: rows.map((row) => ({
          warehouseId: row.warehouseId,
          locationId: row.locationId,
          quantity: row.quantity,
        })),
      },
    });
  }

  async function onShip() {
    if (line.shipStatus !== 'assigned' && line.shipStatus !== 'partial') {
      if (!validation.ok) return;
      await saveAllocations.mutateAsync({
        orderId,
        input: {
          productId: line.productId,
          allocations: rows.map((row) => ({
            warehouseId: row.warehouseId,
            locationId: row.locationId,
            quantity: row.quantity,
          })),
        },
      });
    }
    await shipLine.mutateAsync({ orderId, input: { productId: line.productId } });
    setOpen(false);
  }

  const summary =
    line.allocations.length > 0
      ? line.allocations
          .map((allocation) => {
            const match = availability.find((row) => row.locationId === allocation.locationId);
            const label = match
              ? `${match.warehouseNameAr} (${allocation.quantity})`
              : `${allocation.locationId} (${allocation.quantity})`;
            return label;
          })
          .join(' · ')
      : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-start"
        onClick={() => setOpen((value) => !value)}
      >
        <div>
          <p className="font-medium text-foreground">{line.productNameAr}</p>
          <p className="text-xs text-muted-foreground">الكمية: {line.quantity}</p>
          {summary && !open ? <p className="mt-1 text-xs text-muted-foreground">{summary}</p> : null}
        </div>
        <Badge variant={isShipped ? 'success' : line.shipStatus === 'assigned' ? 'warning' : 'subtle'}>
          {isShipped ? 'تم الشحن' : progressLabel}
        </Badge>
      </button>

      {open && !isShipped ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium">
            توزيع {line.productNameAr} ({line.quantity} قطعة)
          </p>

          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setShowAvailability((value) => !value)}
          >
            {showAvailability ? 'إخفاء التوفر' : 'عرض توفر المواقع'}
          </button>

          {showAvailability ? (
            <div className="flex flex-wrap gap-2">
              {isLoading ? (
                <p className="text-xs text-muted-foreground">جاري التحميل…</p>
              ) : availability.length === 0 ? (
                <p className="text-xs text-destructive">لا توجد كمية متاحة في المواقع.</p>
              ) : (
                availability.map((row) => (
                  <Badge key={row.locationId} variant="outline">
                    {row.warehouseNameAr} / {row.locationNameAr} ({row.quantity})
                  </Badge>
                ))
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={multi ? 'outline' : 'default'}
              onClick={() => setMode(false)}
            >
              موقع واحد
            </Button>
            <Button
              type="button"
              size="sm"
              variant={multi ? 'default' : 'outline'}
              onClick={() => setMode(true)}
            >
              مواقع متعددة
            </Button>
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.key} className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  dir="ltr"
                  className="w-20"
                  value={row.quantity}
                  onChange={(event) =>
                    updateRow(row.key, { quantity: Math.max(0, Number(event.target.value) || 0) })
                  }
                  disabled={!multi && rows.length === 1}
                />
                <Select
                  value={row.locationId || undefined}
                  onValueChange={(value) => updateRow(row.key, { locationId: value })}
                >
                  <SelectTrigger className="min-w-[14rem] flex-1" aria-label="اختر الموقع">
                    <SelectValue placeholder="اختر الموقع" />
                  </SelectTrigger>
                  <SelectContent>
                    {availability.map((option) => (
                      <SelectItem key={option.locationId} value={option.locationId}>
                        {option.warehouseNameAr} / {option.locationNameAr} ({option.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {multi ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="حذف الصف"
                    onClick={() => setRows((prev) => prev.filter((item) => item.key !== row.key))}
                    disabled={rows.length <= 1}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>

          {multi ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  {
                    key: `row-${Math.random().toString(36).slice(2, 7)}`,
                    warehouseId: '',
                    locationId: '',
                    quantity: 1,
                  },
                ])
              }
            >
              <Plus className="me-1 h-3.5 w-3.5" />
              موقع
            </Button>
          ) : null}

          {!validation.ok && total > 0 ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {validation.error}
            </div>
          ) : null}

          {validation.ok ? (
            <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              التوزيع يغطي الكمية المطلوبة ({total}/{line.quantity}).
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" disabled={!validation.ok || isSaving} onClick={() => void onSave()}>
              <Check className="me-1 h-3.5 w-3.5" />
              حفظ
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isSaving || (!validation.ok && line.shipStatus !== 'assigned')}
              onClick={() => void onShip()}
            >
              تم الشحن
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      ) : null}

      {open && isShipped ? (
        <p className={cn('mt-3 text-sm text-muted-foreground')}>
          شُحن من: {summary ?? '—'}
        </p>
      ) : null}
    </div>
  );
}
