import { useQuery } from '@tanstack/react-query';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { categoriesApi } from '@/features/ecommerce/admin/categories/lib/api/categories';
import { categoriesQueryKeys } from '@/features/ecommerce/admin/categories/hooks/query-keys';
import type { CategoryListQuery } from '@/features/ecommerce/domain/types/category';

export { categoriesQueryKeys };

export function useCategories(query: CategoryListQuery) {
  return useQuery({
    queryKey: categoriesQueryKeys.list(query),
    queryFn: () => categoriesApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}

/** Loads every category page — for parent pickers / tree helpers. */
export function useAllCategories(companyId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...categoriesQueryKeys.all(companyId), 'all-pages'] as const,
    queryFn: () =>
      fetchAllPaginatedItems((page, limit) =>
        categoriesApi.getAll({ companyId, page, limit }),
      ),
    enabled: (options?.enabled ?? true) && Boolean(companyId),
    staleTime: 30_000,
  });
}
