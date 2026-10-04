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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FlexibleQuantityInput } from '@/features/inventory/admin/operations/components/flexible-quantity-input';
import {
  fetchEffectiveUomLines,
  type EffectiveUomLine,
} from '@/features/inventory/lib/api/product-effective-uom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OperationLineVariantSelect } from '@/features/inventory/admin/operations/components/operation-line-variant-select';
import { formatVariantCompactLabel } from '@/features/inventory/admin/operations/lib/variant-display-label';

type Props = {
  companyId: string;
  lines: OperationLineDraft[];
  onChange: (lines: OperationLineDraft[]) => void;
  fromLocationId?: string;
  checksSourceStock?: boolean;
  disabled?: boolean;
  /** Limit the picker to products with on-hand at `fromLocationId`. */
  restrictToSourceLocation?: boolean;
  /** Products hidden from every row's picker (e.g. taken by another document). */
  excludeProductIds?: string[];
  /**
   * Show a "تكلفة الوحدة" column and require it per row — only for inbound
   * kinds (شراء/استلام/تجديد). Never pass true for transfer/outbound: the
   * backend ignores/rejects client-supplied cost there (derived from the
   * source batch or costing engine instead).
   */
  needsUnitCost?: boolean;
  className?: string;
};

export function WarehouseOperationLinesEditor({
  companyId,
  lines,
  onChange,
  fromLocationId,
  checksSourceStock = false,
  disabled,
  restrictToSourceLocation = false,
  excludeProductIds,
  needsUnitCost = false,
  className,
}: Props) {
  const [availableByKey, setAvailableByKey] = React.useState<Record<string, number>>({});
  const [uomByProductId, setUomByProductId] = React.useState<Record<string, EffectiveUomLine[]>>({});

  async function ensureUoms(productId: string): Promise<EffectiveUomLine[]> {
    if (uomByProductId[productId]) return uomByProductId[productId];
    const rows = await fetchEffectiveUomLines(productId);
    setUomByProductId((prev) => ({ ...prev, [productId]: rows }));
    return rows;
  }

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
            line.variantId,
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
        <p className="mb-2 text-xs text-destructive">
          لا يمكن تكرار نفس المنتج/المتغير في أكثر من سطر.
        </p>
      ) : null}
      <p className="mb-2 text-xs text-muted-foreground leading-relaxed">
        كل سطر ={' '}
        <span className="font-medium text-foreground">متغير واحد</span> (أو المنتج الأساسي). لاستلام
        عدة متغيرات من نفس المنتج: أضف سطراً لكل متغير عبر «إضافة صنف».
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[64rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="min-w-[14rem] px-3 py-2.5 text-start font-medium">المنتج</th>
              <th className="min-w-[10rem] px-3 py-2.5 text-start font-medium">المتغير</th>
              <th className="min-w-[8rem] px-3 py-2.5 text-start font-medium">الوحدة</th>
              <th className="min-w-[9rem] px-3 py-2.5 text-start font-medium">الكمية</th>
              {needsUnitCost ? (
                <th className="min-w-[11rem] px-3 py-2.5 text-start font-medium text-emerald-700 dark:text-emerald-400">
                  تكلفة الوحدة (الشراء)
                </th>
              ) : null}
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
                      excludeIds={excludeProductIds}
                      sourceLocationId={
                        restrictToSourceLocation ? fromLocationId : undefined
                      }
                      placeholder={
                        restrictToSourceLocation && !fromLocationId
                          ? 'حدّد موقع الصرف أولًا…'
                          : 'ابحث عن منتج في الموقع…'
                      }
                      onChange={(productId) => {
                        if (!productId) {
                          updateLine(line.id, {
                            productId: '',
                            productName: '',
                            sku: '',
                            variantId: undefined,
                            variantName: undefined,
                          });
                          return;
                        }
                        updateLine(line.id, { productId });
                      }}
                      onProductSelect={(product) => {
                        void (async () => {
                          const rows = await ensureUoms(product.id);
                          const ref = rows.find((row) => row.isReference) ?? rows[0];
                          updateLine(line.id, {
                            productId: product.id,
                            productName: product.nameAr,
                            catalogProductName: product.nameAr,
                            sku: product.sku,
                            variantId: undefined,
                            variantName: undefined,
                            productUomLineId: ref?.id,
                            uomLineName: ref?.nameAr,
                          });
                        })();
                      }}
                    />
                    {line.sku ? (
                      <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">
                        {line.sku}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <OperationLineVariantSelect
                      companyId={companyId}
                      productId={line.productId}
                      catalogProductName={line.catalogProductName ?? line.productName}
                      variantId={line.variantId}
                      variantName={line.variantName}
                      disabled={disabled}
                      onChange={(nextVariantId, variant) => {
                        if (!nextVariantId || !variant) {
                          updateLine(line.id, {
                            variantId: undefined,
                            variantName: undefined,
                            productName: line.catalogProductName ?? line.productName,
                          });
                          return;
                        }
                        const compact = formatVariantCompactLabel(
                          variant,
                          line.catalogProductName ?? line.productName,
                        );
                        updateLine(line.id, {
                          variantId: variant.id,
                          variantName: compact,
                          productName: line.catalogProductName ?? line.productName,
                          sku: variant.sku || line.sku,
                        });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {line.productId ? (
                      <Select
                        value={line.productUomLineId ?? ''}
                        disabled={disabled}
                        onValueChange={(value) => {
                          const rows = uomByProductId[line.productId] ?? [];
                          const picked = rows.find((row) => row.id === value);
                          updateLine(line.id, {
                            productUomLineId: value,
                            uomLineName: picked?.nameAr,
                          });
                        }}
                        onOpenChange={(open) => {
                          if (open && line.productId) void ensureUoms(line.productId);
                        }}
                      >
                        <SelectTrigger className="h-10 w-full min-w-[7rem]">
                          <SelectValue placeholder="الوحدة" />
                        </SelectTrigger>
                        <SelectContent>
                          {(uomByProductId[line.productId] ?? []).map((uom) => (
                            <SelectItem key={uom.id} value={uom.id}>
                              {uom.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <FlexibleQuantityInput
                      className="h-10 w-full min-w-[6rem] max-w-none"
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
                  {needsUnitCost ? (
                    <td className="px-3 py-2.5">
                      <div
                        className={`flex items-center gap-2 rounded-lg border-2 px-1 transition-colors ${
                          line.productId && !line.unitCost?.trim()
                            ? 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-950/30'
                            : 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-950/20'
                        }`}
                      >
                        <Input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          placeholder="0.00"
                          value={line.unitCost ?? ''}
                          disabled={disabled || !line.productId}
                          className="h-10 min-w-[5rem] flex-1 border-0 bg-transparent px-2 text-center font-semibold tabular-nums shadow-none focus-visible:ring-0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            // Match the backend's accepted shape (digits, one
                            // optional dot, up to 8 decimals) so an invalid
                            // value is rejected before ever hitting the API.
                            if (raw === '' || /^\d*\.?\d{0,8}$/.test(raw)) {
                              updateLine(line.id, { unitCost: raw });
                            }
                          }}
                        />
                        <span className="pe-2 text-xs font-medium text-muted-foreground">ر.س</span>
                      </div>
                      {line.productId && !line.unitCost?.trim() ? (
                        <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          أدخل تكلفة الشراء لهذا الصنف
                        </p>
                      ) : null}
                    </td>
                  ) : null}
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
