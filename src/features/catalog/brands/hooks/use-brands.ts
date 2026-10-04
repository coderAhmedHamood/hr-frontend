import { useQuery } from '@tanstack/react-query';
import { brandsApi } from '@/features/catalog/brands/lib/api/brands';
import { brandsQueryKeys } from '@/features/catalog/brands/hooks/query-keys';
import type { BrandListQuery } from '@/features/ecommerce/domain/types/brand';

export { brandsQueryKeys };

export function useBrands(query: BrandListQuery) {
  return useQuery({
    queryKey: brandsQueryKeys.list(query),
    queryFn: () => brandsApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}
