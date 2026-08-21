'use client';

import * as React from 'react';
import type {
  StorefrontPaginated,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';

type Options = {
  /** Changes when filters/category change — resets accumulated list. */
  queryKey: string;
  initialItems: StorefrontProduct[];
  initialPage?: number;
  totalPages: number;
  fetchPage: (page: number) => Promise<StorefrontPaginated<StorefrontProduct>>;
};

export function useInfiniteProductList({
  queryKey,
  initialItems,
  initialPage = 1,
  totalPages,
  fetchPage,
}: Options) {
  const [items, setItems] = React.useState(initialItems);
  const [page, setPage] = React.useState(initialPage);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const loadingRef = React.useRef(false);
  const fetchPageRef = React.useRef(fetchPage);

  React.useEffect(() => {
    fetchPageRef.current = fetchPage;
  }, [fetchPage]);

  React.useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setError(false);
    loadingRef.current = false;
  }, [queryKey, initialItems, initialPage]);

  const hasMore = page < totalPages;

  const loadMore = React.useCallback(async () => {
    if (loadingRef.current || page >= totalPages) return;

    loadingRef.current = true;
    setLoading(true);
    setError(false);

    const nextPage = page + 1;

    try {
      const result = await fetchPageRef.current(nextPage);
      setItems((prev) => {
        const seen = new Set(prev.map((product) => product.id));
        const fresh = result.items.filter((product) => !seen.has(product.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
      setPage(nextPage);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, totalPages]);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const retry = React.useCallback(() => {
    void loadMore();
  }, [loadMore]);

  return { items, loading, error, hasMore, sentinelRef, retry };
}
