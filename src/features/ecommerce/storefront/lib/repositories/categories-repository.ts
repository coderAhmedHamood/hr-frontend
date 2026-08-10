import { mockCategoriesStore } from '@/features/ecommerce/shared/lib/adapters/mock-catalog-store';
import type { StorefrontLocale } from '@/i18n/routing';
import type { StorefrontCategory, StorefrontPaginated } from '@/features/ecommerce/storefront/domain/storefront-models';
import type {
  StorefrontCategoriesPort,
  StorefrontCategoryListQuery,
} from '@/features/ecommerce/storefront/domain/catalog-ports';
import { mapStorefrontCategories, mapStorefrontCategory } from '@/features/ecommerce/storefront/lib/mappers/category-mapper';
import { normalizePaginated } from '@/features/ecommerce/storefront/lib/repositories/normalize';

/** StorefrontCategoriesPort — shared mock catalog store today. */
export const storefrontCategoriesRepository: StorefrontCategoriesPort = {
  async list(query: StorefrontCategoryListQuery): Promise<StorefrontPaginated<StorefrontCategory>> {
    const { locale, ...listQuery } = query;
    const result = await mockCategoriesStore.list(listQuery, (item) => {
      if (!item.isActive) return false;
      if (listQuery.search) {
        const search = listQuery.search.toLowerCase();
        return (
          item.nameAr.toLowerCase().includes(search) ||
          (item.nameEn?.toLowerCase().includes(search) ?? false) ||
          item.slug.toLowerCase().includes(search)
        );
      }
      return true;
    });
    const normalized = normalizePaginated(result);
    return {
      items: mapStorefrontCategories(normalized.items, locale),
      pagination: normalized.pagination,
    };
  },

  async getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontCategory | null> {
    const category = await mockCategoriesStore.getBySlug(companyId, slug);
    if (!category || !category.isActive) return null;
    return mapStorefrontCategory(category, locale);
  },

  async getById(companyId: string, id: string, locale: StorefrontLocale): Promise<StorefrontCategory | null> {
    const category = await mockCategoriesStore.getById(companyId, id);
    if (!category || !category.isActive) return null;
    return mapStorefrontCategory(category, locale);
  },
};
