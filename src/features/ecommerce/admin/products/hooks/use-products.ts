import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import {
  fetchProductOptions,
  type ProductOptionsQuery,
} from '@/features/ecommerce/admin/products/lib/api/product-options';
import { productsQueryKeys } from '@/features/ecommerce/admin/products/hooks/query-keys';
import type { ProductListQuery } from '@/features/ecommerce/domain/types/product';

export { productsQueryKeys };

const OPTIONS_PAGE_SIZE = 30;

/** Paged catalog rows for pickers — one request per scrolled page. */
export function useInfiniteProductOptions(
  query: Omit<ProductOptionsQuery, 'page'>,
  options?: { enabled?: boolean },
) {
  const limit = query.limit ?? OPTIONS_PAGE_SIZE;
  const search = query.search?.trim() || undefined;
  return useInfiniteQuery({
    queryKey: [
      ...productsQueryKeys.all(query.companyId),
      'options',
      { search, status: query.status, limit },
    ] as const,
    queryFn: ({ pageParam }) => fetchProductOptions({ ...query, search, limit, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: Boolean(query.companyId) && (options?.enabled ?? true),
  });
}

export function useProducts(query: ProductListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productsQueryKeys.list(query),
    queryFn: () => productsApi.getAll(query),
    enabled: Boolean(query.companyId) && (options?.enabled ?? true),
  });
}

/** Full product (attributes, variants, media) via GET /inventory/products/:id/full */
export function useProduct(companyId: string, id: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productsQueryKeys.detail(companyId, id ?? ''),
    queryFn: () => productsApi.getById(companyId, id!),
    enabled: Boolean(companyId && id) && (options?.enabled ?? true),
  });
}
