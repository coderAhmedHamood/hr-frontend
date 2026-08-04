import type { PaginatedResult, PaginationMeta } from '@/features/ecommerce/domain/types/common';
import type { StorefrontPaginated } from '@/features/ecommerce/storefront/domain/storefront-models';

const EMPTY_PAGINATION: PaginationMeta = { page: 1, limit: 0, total: 0, totalPages: 1 };

export function normalizePaginated<T>(result: PaginatedResult<T>): StorefrontPaginated<T> {
  return {
    items: result.items,
    pagination: result.pagination ?? EMPTY_PAGINATION,
  };
}

export function emptyPaginated<T>(): StorefrontPaginated<T> {
  return { items: [], pagination: EMPTY_PAGINATION };
}
