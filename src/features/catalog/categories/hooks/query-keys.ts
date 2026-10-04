import type { CategoryListQuery } from '@/features/ecommerce/domain/types/category';

export const categoriesQueryKeys = {
  all: (companyId: string) => [companyId, 'ecommerce', 'categories'] as const,
  list: (query: CategoryListQuery) => [...categoriesQueryKeys.all(query.companyId), 'list', query] as const,
};
