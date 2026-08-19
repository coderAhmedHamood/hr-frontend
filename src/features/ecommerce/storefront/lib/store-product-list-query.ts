import type { ProductListQuery } from '@/features/ecommerce/domain/types/product';

export type StoreProductFlagKey =
  | 'isNewProduct'
  | 'isTodayDeal'
  | 'isWholesale'
  | 'isDiscounted';

export type StoreProductListSearchParams = {
  page?: string;
  category?: string;
  tag?: string;
  sort?: string;
  isNewProduct?: string;
  isTodayDeal?: string;
  isWholesale?: string;
  isDiscounted?: string;
};

export type ParsedStoreProductFlags = Partial<Record<StoreProductFlagKey, true>>;

const FLAG_KEYS: StoreProductFlagKey[] = [
  'isNewProduct',
  'isTodayDeal',
  'isWholesale',
  'isDiscounted',
];

/** URL values accepted as boolean true for storefront flag filters. */
export function isTruthySearchFlag(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

export function parseStoreProductFlags(
  search: Pick<
    StoreProductListSearchParams,
    StoreProductFlagKey
  >,
): ParsedStoreProductFlags {
  const flags: ParsedStoreProductFlags = {};
  for (const key of FLAG_KEYS) {
    if (isTruthySearchFlag(search[key])) flags[key] = true;
  }
  return flags;
}

export function flagsToQueryRecord(
  flags: ParsedStoreProductFlags,
): Record<string, string | undefined> {
  return {
    isNewProduct: flags.isNewProduct ? 'true' : undefined,
    isTodayDeal: flags.isTodayDeal ? 'true' : undefined,
    isWholesale: flags.isWholesale ? 'true' : undefined,
    isDiscounted: flags.isDiscounted ? 'true' : undefined,
  };
}

type ResolveListQueryInput = {
  page: number;
  limit?: number;
  categoryId?: string;
  tag?: string;
  sort?: string;
  flags?: ParsedStoreProductFlags;
};

/**
 * Shared PLP / CSR list query builder — keeps flag filters aligned with backend
 * `GET /public/inventory/products`.
 */
export function resolveStoreProductsListQuery({
  page,
  limit = 15,
  categoryId,
  tag,
  sort,
  flags = {},
}: ResolveListQueryInput): Omit<ProductListQuery, 'companyId' | 'locale'> {
  const base = {
    page,
    limit,
    categoryId,
    tag,
    isNewProduct: flags.isNewProduct,
    isTodayDeal: flags.isTodayDeal,
    isWholesale: flags.isWholesale,
    isDiscounted: flags.isDiscounted,
  };

  if (sort === 'newest') {
    return { ...base, sort: 'createdAt' as const, sortDirection: 'desc' as const };
  }
  if (sort === 'price-asc') {
    return { ...base, sort: 'price' as const, sortDirection: 'asc' as const };
  }
  if (sort === 'price-desc') {
    return { ...base, sort: 'price' as const, sortDirection: 'desc' as const };
  }
  if (sort === 'best-sellers') {
    return { ...base, tag: tag ?? 'best-seller' };
  }
  return base;
}
