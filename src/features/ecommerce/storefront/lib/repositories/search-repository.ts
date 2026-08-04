import { storefrontProductsRepository } from '@/features/ecommerce/storefront/lib/repositories/products-repository';
import { storefrontCategoriesRepository } from '@/features/ecommerce/storefront/lib/repositories/categories-repository';
import { storefrontBrandsRepository } from '@/features/ecommerce/storefront/lib/repositories/brands-repository';
import type { StorefrontPaginated, StorefrontProduct, StorefrontCategory, StorefrontBrand } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import { emptyPaginated } from '@/features/ecommerce/storefront/lib/repositories/normalize';

export type StorefrontSearchResult = {
  products: StorefrontPaginated<StorefrontProduct>;
  categories: StorefrontPaginated<StorefrontCategory>;
  brands: StorefrontPaginated<StorefrontBrand>;
  query: string;
};

/** Unified storefront search across products, categories, and brands. */
export const storefrontSearchRepository = {
  async search(
    companyId: string,
    locale: StorefrontLocale,
    query: string,
    options?: { limit?: number },
  ): Promise<StorefrontSearchResult> {
    const trimmed = query.trim();
    const limit = options?.limit ?? 12;

    if (!trimmed) {
      return {
        products: emptyPaginated(),
        categories: emptyPaginated(),
        brands: emptyPaginated(),
        query: trimmed,
      };
    }

    const [products, categories, brands] = await Promise.all([
      storefrontProductsRepository.list({ companyId, locale, search: trimmed, page: 1, limit }),
      storefrontCategoriesRepository.list({ companyId, locale, search: trimmed, page: 1, limit: 6 }),
      storefrontBrandsRepository.list({ companyId, locale, search: trimmed, page: 1, limit: 6 }),
    ]);

    return { products, categories, brands, query: trimmed };
  },
};
