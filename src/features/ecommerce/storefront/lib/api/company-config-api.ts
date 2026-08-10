import { storefrontCompanyRepository } from '@/features/ecommerce/storefront/lib/repositories/company-repository';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';

/**
 * Backed by the storefront company repository today. Swap for HTTP when backend ships.
 */
export const companyConfigApi = {
  async getByCompanyId(companyId: string, locale: StorefrontLocale): Promise<StorefrontCompanyConfig | null> {
    return storefrontCompanyRepository.getByCompanyId(companyId, locale);
  },
};
