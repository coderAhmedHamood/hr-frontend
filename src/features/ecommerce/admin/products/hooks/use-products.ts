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

/** Full product (attributes, variants, media) via GET /inventory/products/:id/full */
export function useProduct(companyId: string, id: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productsQueryKeys.detail(companyId, id ?? ''),
    queryFn: () => productsApi.getById(companyId, id!),
    enabled: Boolean(companyId && id) && (options?.enabled ?? true),
  });
}
