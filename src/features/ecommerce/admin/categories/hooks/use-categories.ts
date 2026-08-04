import { useQuery } from '@tanstack/react-query';
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
