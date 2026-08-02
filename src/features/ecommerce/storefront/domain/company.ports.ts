import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';

export type CompanyStorefrontPort = {
  getByCompanyId(companyId: string, locale: StorefrontLocale): Promise<StorefrontCompanyConfig | null>;
};

export type CompanyCmsPort = {
  getRecordByCompanyId(companyId: string): Promise<CompanyConfigRecord | null>;
  saveRecord(record: CompanyConfigRecord): Promise<CompanyConfigRecord>;
};
