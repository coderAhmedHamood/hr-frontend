'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { cn } from '@/shared/utils';
import { useDialogPortalContainer } from '@/components/ui/dialog';
import { useProduct, useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import type { Product, ProductStatus } from '@/features/ecommerce/domain/types/product';

const MIN_SEARCH_LEN = 1;
const SEARCH_LIMIT = 30;

export type ProductSinglePickerProps = {
  companyId: string;
  value: string;
  onChange: (productId: string) => void;
  /** Fires with the full product row when the user picks from search results. */
  onProductSelect?: (product: Product) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  status?: ProductStatus;
  /** Hide these product ids from search results (e.g. already favorited). */
  excludeIds?: string[];
  className?: string;
  'aria-label'?: string;
};

function productLabel(product: Pick<Product, 'nameAr' | 'sku'>): string {
  return product.nameAr?.trim() || product.sku?.trim() || '—';
}

export function ProductSinglePicker({
  companyId,
  value,
  onChange,
  onProductSelect,
  placeholder = 'ابحث عن منتج…',
  searchPlaceholder = 'الاسم أو SKU…',
  disabled,
  allowClear,
  status,
  excludeIds,
  className,
  'aria-label': ariaLabel,
}: ProductSinglePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const dialogContainer = useDialogPortalContainer();
  const excludeSet = React.useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  const { data: selectedProduct } = useProduct(companyId, value || null, {
    enabled: Boolean(companyId && value),
  });

  const canQuery = debouncedSearch.length >= MIN_SEARCH_LEN;
  const { data: searchData, isFetching: isSearching } = useProducts(
    {
      companyId,
      search: debouncedSearch,
      status,
      page: 1,
      limit: SEARCH_LIMIT,
    },
    { enabled: Boolean(companyId) && canQuery },
  );

  const results = React.useMemo(
    () => (searchData?.items ?? []).filter((product) => !excludeSet.has(product.id)),
    [searchData?.items, excludeSet],
  );

  const selectedLabel = value
    ? selectedProduct
      ? productLabel(selectedProduct)
      : '…'
    : null;

  function pick(product: Product) {
    onChange(product.id);
    onProductSelect?.(product);
    setOpen(false);
    setSearch('');
  }

  function clearSelection(event: React.MouseEvent) {
    event.stopPropagation();
    onChange('');
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
          aria-label={ariaLabel ?? 'المنتج'}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel ?? placeholder}
          </span>
          <div className="flex items-center gap-1">
            {allowClear && value ? (
              <span
                role="button"
                tabIndex={0}
                onClick={clearSelection}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    clearSelection(event as unknown as React.MouseEvent);
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </span>
            ) : null}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={dialogContainer ?? undefined}>
        <PopoverPrimitive.Content
          className="popover-match-trigger z-[200] min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-0 shadow-elevated"
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
                placeholder={searchPlaceholder}
                className="w-full rounded-sm border border-input bg-background py-1.5 pr-7 pl-2 text-sm focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div
            className="max-h-52 overflow-y-auto overscroll-contain"
            onWheel={(event) => event.stopPropagation()}
          >
            {!canQuery ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                اكتب للبحث عن منتج بالاسم أو SKU
              </div>
            ) : isSearching ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">جاري البحث…</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">لا توجد منتجات مطابقة</div>
            ) : (
              results.map((product) => {
                const isSelected = product.id === value;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => pick(product)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm text-right transition-colors hover:bg-muted/60',
                      isSelected && 'bg-primary/10 font-medium text-primary',
                    )}
                  >
                    <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{product.nameAr}</p>
                      {product.sku ? (
                        <p className="truncate text-xs text-muted-foreground" dir="ltr">
                          {product.sku}
                        </p>
                      ) : null}
                    </div>
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
