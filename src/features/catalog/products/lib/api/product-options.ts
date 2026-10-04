import {
  apiRequest,
  ensurePaginatedResult,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { ProductStatus } from '@/features/ecommerce/domain/types/product';

/**
 * Minimal product row for pickers/autocompletes. Unlike `productsApi.getAll` this
 * skips the per-company media fetch and the full product mapping, so it stays cheap
 * enough to call once per scrolled page.
 */
export type ProductOption = {
  id: string;
  nameAr: string;
  nameEn?: string;
  sku: string;
  barcode?: string;
  status: ProductStatus;
};

export type ProductOptionsQuery = {
  companyId: string;
  search?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
};

type ProductOptionDto = {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
  sku?: string | null;
  barcode?: string | null;
  status?: ProductStatus | null;
};

export async function fetchProductOptions(
  query: ProductOptionsQuery,
): Promise<PaginatedResult<ProductOption>> {
  const result = await apiRequest<PaginatedResult<ProductOptionDto>>('/inventory/products', {
    query: {
      companyId: resolveStorefrontCompanyId(query.companyId),
      search: query.search?.trim() || undefined,
      status: query.status,
      sort: 'name',
      sortDirection: 'asc',
      page: query.page ?? 1,
      limit: query.limit ?? 30,
      archiveScope: query.status === 'archived' ? 'archived' : 'active',
    },
  });

  const safe = ensurePaginatedResult(result);
  return {
    items: safe.items.map((dto) => ({
      id: dto.id,
      nameAr: dto.nameAr ?? '',
      nameEn: dto.nameEn ?? undefined,
      sku: dto.sku ?? '',
      barcode: dto.barcode ?? undefined,
      status: dto.status ?? 'active',
    })),
    pagination: safe.pagination,
  };
}
