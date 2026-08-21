import type { DataSourceConfig, QueryDataSource } from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import { storefrontCategoriesRepository } from '@/features/ecommerce/storefront/lib/repositories/categories-repository';
import type { StorefrontLocale } from '@/i18n/routing';

type StorePath = `/store${string}`;

function productsQueryPath(query: string): StorePath {
  return `/store/products?${query}` as StorePath;
}

function resolveQuerySortParam(dataSource: QueryDataSource): string | null {
  if (dataSource.sort === 'sales') return 'sort=best-sellers';
  if (dataSource.sort === 'createdAt' && dataSource.sortDirection === 'desc') {
    return 'sort=newest';
  }
  if (dataSource.sort === 'price') {
    return dataSource.sortDirection === 'asc' ? 'sort=price-asc' : 'sort=price-desc';
  }
  return null;
}

function resolveQueryFlagsPath(dataSource: QueryDataSource): StorePath | null {
  if (dataSource.isTodayDeal === true) return '/store/offers';
  if (dataSource.isWholesale === true) return '/store/wholesale';
  if (dataSource.isDiscounted === true) return productsQueryPath('isDiscounted=1');
  if (dataSource.isNewProduct === true) return productsQueryPath('isNewProduct=1');
  return null;
}

async function resolveCategoryProductsPath(
  companyId: string,
  locale: StorefrontLocale,
  categoryId: string,
): Promise<StorePath | null> {
  const category = await storefrontCategoriesRepository.getById(companyId, categoryId, locale);
  if (!category?.slug) return null;
  return productsQueryPath(`category=${encodeURIComponent(category.slug)}`);
}

/**
 * Maps a page-builder product data source to the storefront PLP URL that lists
 * the same filter (used for «عرض الكل» on home carousels).
 */
export async function resolveDataSourceViewAllHref(
  companyId: string,
  locale: StorefrontLocale,
  dataSource: DataSourceConfig,
): Promise<StorePath | null> {
  switch (dataSource.kind) {
    case 'manual':
      return null;
    case 'tag':
      return productsQueryPath(`tag=${encodeURIComponent(dataSource.tag)}`);
    case 'category':
      return resolveCategoryProductsPath(companyId, locale, dataSource.categoryId);
    case 'collection':
      return '/store/products';
    case 'recommendation':
      return '/store/products';
    case 'query': {
      const flagPath = resolveQueryFlagsPath(dataSource);
      if (flagPath) return flagPath;
      if (dataSource.tag) {
        return productsQueryPath(`tag=${encodeURIComponent(dataSource.tag)}`);
      }
      if (dataSource.categoryId) {
        return resolveCategoryProductsPath(companyId, locale, dataSource.categoryId);
      }
      const sortParam = resolveQuerySortParam(dataSource);
      return sortParam ? productsQueryPath(sortParam) : '/store/products';
    }
    default:
      return null;
  }
}

export async function resolveSectionViewAllHref(
  companyId: string,
  locale: StorefrontLocale,
  dataSource: DataSourceConfig,
  cmsOverride: StorePath | null | undefined,
): Promise<StorePath | null> {
  if (cmsOverride) return cmsOverride;
  return resolveDataSourceViewAllHref(companyId, locale, dataSource);
}
