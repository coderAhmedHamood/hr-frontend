'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { fetchActiveProductVariants } from '@/features/inventory/admin/operations/lib/fetch-active-product-variants';
import {
  formatVariantCompactLabel,
  variantMatchesSearch,
} from '@/features/inventory/admin/operations/lib/variant-display-label';
import type { ProductVariant } from '@/features/ecommerce/domain/types/product';
import { useDialogPortalContainer } from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

const BASE_VARIANT_VALUE = '__base__';

export type OperationLineVariantSelectProps = {
  companyId: string;
  productId: string;
  /** Parent product title — shortens variant labels in the list. */
  catalogProductName?: string;
  variantId?: string;
  /** Precomputed compact label for the trigger when variantId is set. */
  variantName?: string;
  onChange: (variantId: string | undefined, variant?: ProductVariant) => void;
  disabled?: boolean;
  className?: string;
};

export function OperationLineVariantSelect({
  companyId,
  productId,
  catalogProductName,
  variantId,
  variantName,
  onChange,
  disabled,
  className,
}: OperationLineVariantSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [variants, setVariants] = React.useState<ProductVariant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const dialogContainer = useDialogPortalContainer();

  React.useEffect(() => {
    if (!companyId || !productId.trim()) {
      setVariants([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const rows = await fetchActiveProductVariants(companyId, productId);
        if (!cancelled) setVariants(rows);
      } catch {
        if (!cancelled) setVariants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, productId]);

  const selectedVariant = React.useMemo(
    () => variants.find((row) => row.id === variantId),
    [variants, variantId],
  );

  const triggerLabel = React.useMemo(() => {
    if (!productId.trim()) return null;
    if (variantId && selectedVariant) {
      return (
        variantName?.trim() ||
        formatVariantCompactLabel(selectedVariant, catalogProductName)
      );
    }
    if (variantId) return variantName?.trim() || 'متغير';
    if (variants.length === 0 && !loading) return 'بدون متغيرات';
    return 'المنتج الأساسي';
  }, [
    productId,
    variantId,
    selectedVariant,
    variantName,
    catalogProductName,
    variants.length,
    loading,
  ]);

  const filtered = React.useMemo(() => {
    return variants.filter((row) => variantMatchesSearch(row, catalogProductName, search));
  }, [variants, catalogProductName, search]);

  if (!productId.trim()) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  if (loading && variants.length === 0) {
    return <span className="text-xs text-muted-foreground">…</span>;
  }

  if (variants.length === 0) {
    return (
      <span className="text-xs text-muted-foreground" title="لا متغيرات نشطة على هذا المنتج">
        بدون متغيرات
      </span>
    );
  }

  function pickBase() {
    onChange(undefined);
    setOpen(false);
    setSearch('');
  }

  function pickVariant(variant: ProductVariant) {
    onChange(variant.id, variant);
    setOpen(false);
    setSearch('');
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
      modal={false}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="المتغير"
          className={cn(
            'flex h-10 w-full min-w-[9rem] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate text-start', !triggerLabel && 'text-muted-foreground')}>
            {triggerLabel ?? 'اختر المتغير'}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={dialogContainer ?? undefined}>
        <PopoverPrimitive.Content
          className="popover-dropdown-fit-content z-[200] max-h-[min(320px,70vh)] overflow-hidden rounded-md border border-border bg-popover p-0 shadow-elevated"
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="SKU أو سعة / لون / مقاس…"
                className="w-full rounded-sm border border-input bg-background py-1.5 pr-7 pl-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-start text-sm hover:bg-muted',
                !variantId && 'bg-muted/60',
              )}
              onClick={pickBase}
            >
              <Check className={cn('h-4 w-4 shrink-0', variantId ? 'opacity-0' : 'opacity-100')} />
              <span>المنتج الأساسي (بدون متغير)</span>
            </button>
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">لا نتائج</p>
            ) : (
              filtered.map((variant) => {
                const compact = formatVariantCompactLabel(variant, catalogProductName);
                const active = variant.id === variantId;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-2 rounded-sm px-2 py-2 text-start text-sm hover:bg-muted',
                      active && 'bg-muted/60',
                    )}
                    onClick={() => pickVariant(variant)}
                  >
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-0')} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-snug">{compact}</span>
                      {variant.sku ? (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground" dir="ltr">
                          {variant.sku}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function operationLineVariantLabel(variantId?: string, variantName?: string): string {
  if (variantId?.trim()) return variantName?.trim() || 'متغير';
  return 'المنتج الأساسي';
}
