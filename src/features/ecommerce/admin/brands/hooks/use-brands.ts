import { useQuery } from '@tanstack/react-query';
import { brandsApi } from '@/features/ecommerce/admin/brands/lib/api/brands';
import { brandsQueryKeys } from '@/features/ecommerce/admin/brands/hooks/query-keys';
import type { BrandListQuery } from '@/features/ecommerce/domain/types/brand';

export { brandsQueryKeys };

export function useBrands(query: BrandListQuery) {
  return useQuery({
    queryKey: brandsQueryKeys.list(query),
    queryFn: () => brandsApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}
