import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { productsQueryKeys } from '@/features/ecommerce/admin/products/hooks/query-keys';
import type { ProductListQuery } from '@/features/ecommerce/domain/types/product';

export { productsQueryKeys };

export function useProducts(query: ProductListQuery) {
  return useQuery({
    queryKey: productsQueryKeys.list(query),
    queryFn: () => productsApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}
