import type { BrandListQuery } from '@/features/ecommerce/domain/types/brand';

export const brandsQueryKeys = {
  all: (companyId: string) => [companyId, 'ecommerce', 'brands'] as const,
  list: (query: BrandListQuery) => [...brandsQueryKeys.all(query.companyId), 'list', query] as const,
};
