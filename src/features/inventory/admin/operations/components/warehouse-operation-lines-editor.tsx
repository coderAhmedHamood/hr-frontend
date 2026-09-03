'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ProductSinglePicker } from '@/features/ecommerce/admin/products/components/product-single-picker';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import {
  emptyOperationLineDraft,
  hasDuplicateOperationLineProducts,
  operationLineDraftKey,
  type OperationLineDraft,
} from '@/features/inventory/admin/operations/lib/operation-line-draft';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FlexibleQuantityInput } from '@/features/inventory/admin/operations/components/flexible-quantity-input';

type Props = {
  companyId: string;
  lines: OperationLineDraft[];
  onChange: (lines: OperationLineDraft[]) => void;
  fromLocationId?: string;
  checksSourceStock?: boolean;
  disabled?: boolean;
  /** Products hidden from every row's picker (e.g. taken by another document). */
  excludeProductIds?: string[];
  className?: string;
};

export function WarehouseOperationLinesEditor({
  companyId,
  lines,
  onChange,
  fromLocationId,
  checksSourceStock = false,
  disabled,
  excludeProductIds,
  className,
}: Props) {
  const [availableByKey, setAvailableByKey] = React.useState<Record<string, number>>({});

  // A product sitting on another row is hidden from this row's search, so a
  // duplicate can never be picked in the first place.
  const pickedProductIds = React.useMemo(
    () => lines.map((line) => line.productId.trim()).filter(Boolean),
    [lines],
  );

  React.useEffect(() => {
    if (!companyId || !checksSourceStock || !fromLocationId) {
      setAvailableByKey({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const next: Record<string, number> = {};
      await Promise.all(
        lines.map(async (line) => {
          if (!line.productId.trim()) return;
          const key = operationLineDraftKey(line);
          const available = await inventoryStockService.getQuantityAtLocation(
            companyId,
            line.productId,
            fromLocationId,
          );
          next[key] = Math.max(0, available);
        }),
      );
      if (!cancelled) setAvailableByKey(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, checksSourceStock, fromLocationId, lines]);

  function updateLine(id: string, patch: Partial<OperationLineDraft>) {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function removeLine(id: string) {
    const next = lines.filter((line) => line.id !== id);
    onChange(next.length > 0 ? next : [emptyOperationLineDraft()]);
  }

  function addLine() {
    onChange([...lines, emptyOperationLineDraft()]);
  }

  const duplicateProducts = hasDuplicateOperationLineProducts(lines);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>أصناف المستند</Label>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addLine}>
          <Plus className="me-1 h-3.5 w-3.5" />
          إضافة صنف
        </Button>
      </div>

      {duplicateProducts ? (
        <p className="mb-2 text-xs text-destructive">لا يمكن تكرار نفس المنتج في أكثر من سطر.</p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
              <th className="px-3 py-2.5 text-start font-medium">الكمية</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const key = operationLineDraftKey(line);
              const available = line.productId ? availableByKey[key] : undefined;
              const usedByOthers = lines
                .filter((other) => other.id !== line.id && operationLineDraftKey(other) === key)
                .reduce((sum, other) => sum + Math.max(0, other.quantity), 0);
              const maxQty =
                available != null ? Math.max(0, available - usedByOthers) : null;

              return (
                <tr key={line.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-2.5">
                    <ProductSinglePicker
                      companyId={companyId}
                      value={line.productId}
                      status="active"
                      disabled={disabled}
                      excludeIds={[
                        ...(excludeProductIds ?? []),
                        ...pickedProductIds.filter((id) => id !== line.productId.trim()),
                      ]}
                      placeholder="ابحث عن منتج…"
                      onChange={(productId) => {
                        if (!productId) {
                          updateLine(line.id, {
                            productId: '',
                            productName: '',
                            sku: '',
                          });
                          return;
                        }
                        updateLine(line.id, { productId });
                      }}
                      onProductSelect={(product) => {
                        updateLine(line.id, {
                          productId: product.id,
                          productName: product.nameAr,
                          sku: product.sku,
                        });
                      }}
                    />
                    {line.sku ? (
                      <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">
                        {line.sku}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <FlexibleQuantityInput
                      value={line.quantity}
                      max={maxQty}
                      disabled={disabled || !line.productId}
                      onChange={(quantity) => updateLine(line.id, { quantity })}
                    />
                    {checksSourceStock && available != null ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        المتاح: {maxQty ?? available}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={disabled}
                      aria-label="حذف السطر"
                      onClick={() => removeLine(line.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
