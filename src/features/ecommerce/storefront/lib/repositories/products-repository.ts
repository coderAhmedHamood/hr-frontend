import { mockProductsStore } from '@/features/ecommerce/shared/lib/adapters/mock-catalog-store';
import type { Product, ProductListQuery } from '@/features/ecommerce/domain/types/product';
import type { StorefrontLocale } from '@/i18n/routing';
import type { StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import type {
  StorefrontProductListQuery,
  StorefrontProductsPort,
} from '@/features/ecommerce/storefront/domain/catalog-ports';
import { mapStorefrontProduct, mapStorefrontProducts } from '@/features/ecommerce/storefront/lib/mappers/product-mapper';
import { normalizePaginated } from '@/features/ecommerce/storefront/lib/repositories/normalize';

function sortComparator(query: ProductListQuery): ((a: Product, b: Product) => number) | undefined {
  if (!query.sort) return undefined;
  const direction = query.sortDirection === 'desc' ? -1 : 1;

  return (a, b) => {
    switch (query.sort) {
      case 'name':
        return a.nameAr.localeCompare(b.nameAr) * direction;
      case 'price':
        return (a.price.amount - b.price.amount) * direction;
      case 'createdAt':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      default:
        return 0;
    }
  };
}

function matchesActiveProduct(item: Product, query: ProductListQuery): boolean {
  if (item.status !== 'active') return false;
  if (query.categoryId && item.categoryId !== query.categoryId) return false;
  if (query.brandId && item.brandId !== query.brandId) return false;
  if (query.tag && !(item.tags?.includes(query.tag) ?? false)) return false;
  if (query.minPrice !== undefined && item.price.amount < query.minPrice) return false;
  if (query.maxPrice !== undefined && item.price.amount > query.maxPrice) return false;
  if (query.search) {
    const search = query.search.toLowerCase();
    return (
      item.nameAr.toLowerCase().includes(search) ||
      (item.nameEn?.toLowerCase().includes(search) ?? false) ||
      item.sku.toLowerCase().includes(search) ||
      (item.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
    );
  }
  return true;
}

/** StorefrontProductsPort — same mock catalog store as Admin; HTTP Storefront API later. */
export const storefrontProductsRepository: StorefrontProductsPort = {
  async list(query: StorefrontProductListQuery): Promise<StorefrontPaginated<StorefrontProduct>> {
    const { locale, ...listQuery } = query;
    const result = await mockProductsStore.list(
      { ...listQuery, status: 'active' },
      matchesActiveProduct,
      sortComparator({ ...listQuery, status: 'active' }),
    );
    const normalized = normalizePaginated(result);
    return {
      items: mapStorefrontProducts(normalized.items, locale),
      pagination: normalized.pagination,
    };
  },

  async getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontProduct | null> {
    const product = await mockProductsStore.getBySlug(companyId, slug);
    if (!product || product.status !== 'active') return null;
    return mapStorefrontProduct(product, locale);
  },

  async getById(companyId: string, id: string, locale: StorefrontLocale): Promise<StorefrontProduct | null> {
    const product = await mockProductsStore.getById(companyId, id);
    if (!product || product.status !== 'active') return null;
    return mapStorefrontProduct(product, locale);
  },

  async getByIds(companyId: string, ids: string[], locale: StorefrontLocale): Promise<StorefrontProduct[]> {
    if (ids.length === 0) return [];
    const products = await mockProductsStore.getByIds(companyId, ids);
    return mapStorefrontProducts(
      products.filter((product) => product.status === 'active'),
      locale,
    );
  },
};

export type { StorefrontProductListQuery };
