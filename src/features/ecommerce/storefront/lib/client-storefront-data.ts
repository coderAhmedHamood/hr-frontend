import { companyConfigApi } from '@/features/ecommerce/storefront/lib/api/company-config-api';
import { applyStorefrontTheme } from '@/features/ecommerce/storefront/lib/get-storefront-theme-colors';
import { DEFAULT_STOREFRONT_TYPOGRAPHY } from '@/features/ecommerce/storefront/lib/storefront-fonts';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontBrandsRepository } from '@/features/ecommerce/storefront/lib/repositories/brands-repository';
import { storefrontCategoriesRepository } from '@/features/ecommerce/storefront/lib/repositories/categories-repository';
import { storefrontProductsRepository } from '@/features/ecommerce/storefront/lib/repositories/products-repository';
import { storefrontContentRepository } from '@/features/ecommerce/storefront/lib/repositories/content-repository';
import { storefrontOrdersRepository } from '@/features/ecommerce/storefront/lib/repositories/storefront-orders-repository';
import { loadStorefrontHomepage } from '@/features/ecommerce/storefront/page-builder/services/page.service';
import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import type { StorefrontProductListQuery } from '@/features/ecommerce/storefront/domain/catalog-ports';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';

function withBranding(config: StorefrontCompanyConfig): StorefrontCompanyConfig {
  const branding = applyStorefrontTheme(
    config.theme,
    config.typography ?? DEFAULT_STOREFRONT_TYPOGRAPHY,
  );
  return {
    ...config,
    theme: branding.theme,
    themeCssVars: branding.themeCssVars,
    typography: branding.typography,
  };
}

/** Client-safe storefront data access (no next-intl/server / React cache). */
export const clientStorefrontData = {
  companyId(): string {
    return getStorefrontCompanyId();
  },

  async getConfig(locale: StorefrontLocale): Promise<StorefrontCompanyConfig | null> {
    const config = await companyConfigApi.getByCompanyId(getStorefrontCompanyId(), locale);
    if (!config) return null;
    return withBranding(config);
  },

  async getNavCategories(locale: StorefrontLocale) {
    const result = await storefrontCategoriesRepository.list({
      companyId: getStorefrontCompanyId(),
      locale,
      limit: 200,
    });
    return result.items;
  },

  async getBrands(
    locale: StorefrontLocale,
    options?: { page?: number; limit?: number; search?: string },
  ) {
    return storefrontBrandsRepository.list({
      companyId: getStorefrontCompanyId(),
      locale,
      ...options,
    });
  },

  async getBrandBySlug(locale: StorefrontLocale, slug: string) {
    return storefrontBrandsRepository.getBySlug(getStorefrontCompanyId(), slug, locale);
  },

  async getCategories(
    locale: StorefrontLocale,
    options?: { page?: number; limit?: number; search?: string },
  ) {
    return storefrontCategoriesRepository.list({
      companyId: getStorefrontCompanyId(),
      locale,
      ...options,
    });
  },

  async getCategoryBySlug(locale: StorefrontLocale, slug: string) {
    return storefrontCategoriesRepository.getBySlug(getStorefrontCompanyId(), slug, locale);
  },

  async getCategoryById(locale: StorefrontLocale, id: string) {
    return storefrontCategoriesRepository.getById(getStorefrontCompanyId(), id, locale);
  },

  async getProducts(
    locale: StorefrontLocale,
    options: Omit<StorefrontProductListQuery, 'companyId' | 'locale'>,
  ) {
    return storefrontProductsRepository.list({
      companyId: getStorefrontCompanyId(),
      locale,
      ...options,
    });
  },

  async getProductBySlug(locale: StorefrontLocale, slug: string) {
    return storefrontProductsRepository.getBySlug(getStorefrontCompanyId(), slug, locale);
  },

  async getHomepage(locale: StorefrontLocale, homeTitleFallback: string) {
    return loadStorefrontHomepage(getStorefrontCompanyId(), locale, homeTitleFallback);
  },

  async getAbout(locale: StorefrontLocale) {
    return storefrontContentRepository.getAbout(getStorefrontCompanyId(), locale);
  },

  async getContact(locale: StorefrontLocale) {
    return storefrontContentRepository.getContact(getStorefrontCompanyId(), locale);
  },

  async getFaq(locale: StorefrontLocale) {
    return storefrontContentRepository.getFaq(getStorefrontCompanyId(), locale);
  },

  async getLegal(locale: StorefrontLocale, slug: LegalPageSlug) {
    return storefrontContentRepository.getLegalPage(getStorefrontCompanyId(), slug, locale);
  },

  async getOrderByNumber(orderNumber: string, phone?: string | null) {
    return storefrontOrdersRepository.getByOrderNumber(
      getStorefrontCompanyId(),
      orderNumber,
      { phone },
    );
  },
};
