import { mockBrandsStore } from '@/features/ecommerce/shared/lib/adapters/mock-catalog-store';
import type { StorefrontLocale } from '@/i18n/routing';
import type { StorefrontBrand, StorefrontPaginated } from '@/features/ecommerce/storefront/domain/storefront-models';
import type {
  StorefrontBrandListQuery,
  StorefrontBrandsPort,
} from '@/features/ecommerce/storefront/domain/catalog-ports';
import { mapStorefrontBrand, mapStorefrontBrands } from '@/features/ecommerce/storefront/lib/mappers/brand-mapper';
import { normalizePaginated } from '@/features/ecommerce/storefront/lib/repositories/normalize';

/** StorefrontBrandsPort — shared mock catalog store today. */
export const storefrontBrandsRepository: StorefrontBrandsPort = {
  async list(query: StorefrontBrandListQuery): Promise<StorefrontPaginated<StorefrontBrand>> {
    const { locale, ...listQuery } = query;
    const result = await mockBrandsStore.list(listQuery, (item) => {
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
      items: mapStorefrontBrands(normalized.items, locale),
      pagination: normalized.pagination,
    };
  },

  async getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontBrand | null> {
    const brand = await mockBrandsStore.getBySlug(companyId, slug);
    if (!brand || !brand.isActive) return null;
    return mapStorefrontBrand(brand, locale);
  },
};
