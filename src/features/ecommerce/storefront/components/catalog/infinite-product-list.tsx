'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  StorefrontPaginated,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCard } from '@/features/ecommerce/storefront/components/product-card';
import { ProductListingGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { useInfiniteProductList } from '@/features/ecommerce/storefront/hooks/use-infinite-product-list';
import { Button } from '@/components/ui/button';

type InfiniteProductListProps = {
  queryKey: string;
  initialItems: StorefrontProduct[];
  initialPage?: number;
  totalPages: number;
  fetchPage: (page: number) => Promise<StorefrontPaginated<StorefrontProduct>>;
};

export function InfiniteProductList({
  queryKey,
  initialItems,
  initialPage = 1,
  totalPages,
  fetchPage,
}: InfiniteProductListProps) {
  const t = useTranslations('storefront.products');
  const { items, loading, error, hasMore, sentinelRef, retry } = useInfiniteProductList({
    queryKey,
    initialItems,
    initialPage,
    totalPages,
    fetchPage,
  });

  return (
    <div className="flex flex-col gap-4">
      <ProductListingGrid>
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductListingGrid>

      {error ? (
        <div className="flex justify-center py-2">
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            {t('loadMoreRetry')}
          </Button>
        </div>
      ) : null}

      {hasMore ? (
        <div
          ref={sentinelRef}
          className="flex min-h-12 items-center justify-center py-6"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
              <span className="sr-only">{t('loadingMore')}</span>
            </>
          ) : null}
        </div>
      ) : items.length > 0 && totalPages > 1 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">{t('endOfList')}</p>
      ) : null}
    </div>
  );
}
