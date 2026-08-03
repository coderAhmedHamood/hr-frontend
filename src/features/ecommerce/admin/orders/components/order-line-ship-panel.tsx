'use client';

import * as React from 'react';
import Image from 'next/image';
import { Check, ChevronDown, Package, Plus, X } from 'lucide-react';
import {
  sumAllocationQty,
  validateAllocations,
} from '@/features/ecommerce/admin/orders/lib/allocation-utils';
import {
  useOrderFulfillmentMutations,
  useProductStockAvailability,
} from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
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
    key: `${allocation.id || 'alloc'}-${index}`,
    warehouseId: allocation.warehouseId,
    locationId: allocation.locationId,
    quantity: allocation.quantity,
  }));
}

export function OrderLineShipPanel({ companyId, orderId, line }: Props) {
  const [open, setOpen] = React.useState(false);
  const { data: availability = [], isLoading } = useProductStockAvailability(
    companyId,
    line.productId,
    open,
  );
  const { saveAllocations, shipLine } = useOrderFulfillmentMutations(companyId);
  const [multi, setMulti] = React.useState(line.allocations.length > 1);
  const [rows, setRows] = React.useState<DraftRow[]>(() => toDraftRows(line));
  const [showAvailability, setShowAvailability] = React.useState(false);

  React.useEffect(() => {
    setRows(toDraftRows(line));
    setMulti(line.allocations.length > 1);
  }, [line]);

  React.useEffect(() => {
    if (availability.length === 0) return;
    setRows((prev) => {
      const needsFill = prev.some((row) => !row.locationId);
      if (!needsFill) return prev;
      const preferred =
        availability.find((row) => (row.availableQuantity ?? row.quantity) >= line.quantity) ??
        availability[0];
      if (!preferred) return prev;
      return prev.map((row) =>
        row.locationId
          ? row
          : {
              ...row,
              locationId: preferred.locationId,
              warehouseId: preferred.warehouseId,
            },
      );
    });
  }, [availability, line.quantity]);

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

  const lineTotal = {
    amount: line.unitPrice.amount * line.quantity,
    currency: line.unitPrice.currency,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border/80">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-3 py-2.5 text-start"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
          {line.imageUrl ? (
            <Image src={line.imageUrl} alt="" fill unoptimized className="object-cover" sizes="44px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Package className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{line.productNameAr}</p>
          <p className="text-xs text-muted-foreground">
            {line.quantity} × {formatPrice(line.unitPrice)}
          </p>
        </div>

        <p className="hidden shrink-0 text-sm font-semibold tabular-nums text-foreground sm:block">
          {formatPrice(lineTotal)}
        </p>

        <Badge
          className="shrink-0"
          variant={isShipped ? 'success' : line.shipStatus === 'assigned' || line.shipStatus === 'partial' ? 'warning' : 'outline'}
        >
          {isShipped
            ? 'مجهّز'
            : line.shipStatus === 'assigned' || line.shipStatus === 'partial'
              ? `قيد التجهيز ${progressLabel}`
              : 'لم يُجهَّز'}
        </Badge>

        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && !isShipped ? (
        <div className="space-y-3 border-t border-border px-3 pb-4 pt-4">
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
                availability.map((row, index) => (
                  <Badge key={`${row.warehouseId}-${row.locationId}-${index}`} variant="outline">
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
                    {availability
                      .filter((option) => (option.availableQuantity ?? option.quantity) > 0)
                      .map((option, index) => (
                      <SelectItem
                        key={`${option.warehouseId}-${option.locationId}-${index}`}
                        value={option.locationId}
                      >
                        {option.warehouseNameAr} / {option.locationNameAr} ({option.availableQuantity ?? option.quantity})
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

          {!validation.ok && total > 0 && rows.every((row) => row.locationId) ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {validation.error}
            </div>
          ) : null}

          {!isLoading && availability.length === 0 ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              لا توجد مواقع مخزون متاحة لهذا المنتج. أضف رصيدًا من المخازن أولًا.
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
        <p className="border-t border-border px-3 py-3 text-sm text-muted-foreground">
          شُحن من: {isLoading ? '…' : summary ?? '—'}
        </p>
      ) : null}
    </div>
  );
}
