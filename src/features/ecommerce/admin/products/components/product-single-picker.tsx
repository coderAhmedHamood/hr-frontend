'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { cn } from '@/shared/utils';
import { useDialogPortalContainer } from '@/components/ui/dialog';
import { useInfiniteProductOptions, useProduct } from '@/features/ecommerce/admin/products/hooks/use-products';
import type { ProductOption } from '@/features/ecommerce/admin/products/lib/api/product-options';
import type { Product, ProductStatus } from '@/features/ecommerce/domain/types/product';

const PAGE_SIZE = 30;
/** Distance from the bottom of the list that triggers loading the next page. */
const SCROLL_THRESHOLD_PX = 64;

export type ProductSinglePickerProps = {
  companyId: string;
  value: string;
  onChange: (productId: string) => void;
  /** Fires with the picked catalog row (id, names, sku, barcode). */
  onProductSelect?: (product: ProductOption) => void;
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
  const [pickedOption, setPickedOption] = React.useState<ProductOption | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const dialogContainer = useDialogPortalContainer();
  const listRef = React.useRef<HTMLDivElement>(null);
  const excludeSet = React.useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  // The picked row already carries the label, so the heavier `/full` read is only
  // needed for a selection that came from outside this picker.
  const hasLocalLabel = Boolean(value) && pickedOption?.id === value;
  const { data: selectedProduct } = useProduct(companyId, value || null, {
    enabled: Boolean(companyId && value) && !hasLocalLabel,
  });

  const {
    data: pages,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteProductOptions(
    { companyId, search: debouncedSearch, status, limit: PAGE_SIZE },
    { enabled: Boolean(companyId) && open },
  );

  const results = React.useMemo(
    () =>
      (pages?.pages ?? [])
        .flatMap((page) => page.items)
        .filter((product) => !excludeSet.has(product.id)),
    [pages, excludeSet],
  );

  const isLoadingFirstPage = isFetching && !isFetchingNextPage && results.length === 0;

  const loadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleListScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD_PX) loadMore();
  }

  // `excludeIds` can filter a whole page away, leaving the list too short to scroll.
  React.useEffect(() => {
    const el = listRef.current;
    if (!el || !open) return;
    if (el.scrollHeight <= el.clientHeight) loadMore();
  }, [open, results.length, loadMore]);

  const selectedLabel = value
    ? hasLocalLabel && pickedOption
      ? productLabel(pickedOption)
      : selectedProduct
        ? productLabel(selectedProduct)
        : '…'
    : null;

  function pick(product: ProductOption) {
    setPickedOption(product);
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
            ref={listRef}
            className="max-h-52 overflow-y-auto overscroll-contain"
            onWheel={(event) => event.stopPropagation()}
            onScroll={handleListScroll}
          >
            {isLoadingFirstPage ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {debouncedSearch ? 'جاري البحث…' : 'جاري التحميل…'}
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {debouncedSearch ? 'لا توجد منتجات مطابقة' : 'لا توجد منتجات'}
              </div>
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
            {isFetchingNextPage ? (
              <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                جاري تحميل المزيد…
              </div>
            ) : null}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
