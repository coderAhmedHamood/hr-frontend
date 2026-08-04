import {
  getCompanyConfigMock,
  saveCompanyConfigMock,
} from '@/features/ecommerce/storefront/lib/mock/company-configs';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { CompanyCmsPort, CompanyStorefrontPort } from '@/features/ecommerce/storefront/domain/company.ports';
import type { StorefrontLocale } from '@/i18n/routing';
import { mapStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/mappers/company-mapper';
import { mockRepositoryDelay } from '@/features/ecommerce/storefront/lib/repositories/mock-delay';

/** CompanyStorefrontPort + CompanyCmsPort — one mock config store for both UIs. */
export const storefrontCompanyRepository: CompanyStorefrontPort & CompanyCmsPort = {
  async getByCompanyId(companyId: string, locale: StorefrontLocale): Promise<StorefrontCompanyConfig | null> {
    const record = getCompanyConfigMock(companyId);
    if (!record) return null;
    return mockRepositoryDelay(mapStorefrontCompanyConfig(record, locale));
  },

  async getRecordByCompanyId(companyId: string): Promise<CompanyConfigRecord | null> {
    return mockRepositoryDelay(getCompanyConfigMock(companyId));
  },

  async saveRecord(record: CompanyConfigRecord): Promise<CompanyConfigRecord> {
    return mockRepositoryDelay(saveCompanyConfigMock(record));
  },
};
