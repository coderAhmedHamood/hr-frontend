/**
 * Storefront catalog read ports — localized Storefront* models only.
 * Admin write ports: `@/features/ecommerce/domain/ports/catalog.ports`.
 * Both are backed by `mock-catalog-store` today.
 */
import type { ProductListQuery } from '@/features/ecommerce/domain/types/product';
import type { CategoryListQuery } from '@/features/ecommerce/domain/types/category';
import type { BrandListQuery } from '@/features/ecommerce/domain/types/brand';
import type { StorefrontLocale } from '@/i18n/routing';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontPaginated,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';

export type StorefrontProductListQuery = Omit<ProductListQuery, 'status'> & {
  locale: StorefrontLocale;
};

export type StorefrontProductsPort = {
  list(query: StorefrontProductListQuery): Promise<StorefrontPaginated<StorefrontProduct>>;
  getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontProduct | null>;
  getById(companyId: string, id: string, locale: StorefrontLocale): Promise<StorefrontProduct | null>;
  getByIds(companyId: string, ids: string[], locale: StorefrontLocale): Promise<StorefrontProduct[]>;
};

export type StorefrontCategoryListQuery = Omit<CategoryListQuery, 'isActive'> & {
  locale: StorefrontLocale;
};

export type StorefrontCategoriesPort = {
  list(query: StorefrontCategoryListQuery): Promise<StorefrontPaginated<StorefrontCategory>>;
  getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontCategory | null>;
  getById(companyId: string, id: string, locale: StorefrontLocale): Promise<StorefrontCategory | null>;
};

export type StorefrontBrandListQuery = Omit<BrandListQuery, 'isActive'> & {
  locale: StorefrontLocale;
};

export type StorefrontBrandsPort = {
  list(query: StorefrontBrandListQuery): Promise<StorefrontPaginated<StorefrontBrand>>;
  getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontBrand | null>;
};
