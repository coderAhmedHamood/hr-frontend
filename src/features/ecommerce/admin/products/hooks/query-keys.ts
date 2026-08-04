import type { ProductListQuery } from '@/features/ecommerce/domain/types/product';

/**
 * `companyId` leads every key so switching active company can never surface another
 * company's cached list/detail data — matches the house convention's query-key-factory
 * pattern (see `system/permissions/hooks/query-keys.ts`), extended with the leading
 * `companyId` this feature was previously missing.
 */
export const productsQueryKeys = {
  all: (companyId: string) => [companyId, 'ecommerce', 'products'] as const,
  list: (query: ProductListQuery) => [...productsQueryKeys.all(query.companyId), 'list', query] as const,
};
