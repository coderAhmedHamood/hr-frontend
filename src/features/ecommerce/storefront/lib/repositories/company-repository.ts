import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { CompanyCmsPort, CompanyStorefrontPort } from '@/features/ecommerce/storefront/domain/company.ports';
import type { StorefrontLocale } from '@/i18n/routing';
import { mapStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/mappers/company-mapper';
import {
  isStoreHttpEnabled,
  publicStoreRequest,
  StoreHttpError,
} from '@/features/ecommerce/storefront/lib/api/store-http';
import {
  mapStorefrontConfigDtoToRecord,
  type StorefrontConfigDto,
} from '@/features/ecommerce/storefront/lib/api/store-config-dto';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  fetchAdminStoreConfig,
  saveAdminStoreConfig,
} from '@/features/ecommerce/shared/lib/api/store-settings-api';

async function fetchPublicConfigRecord(companyId: string): Promise<CompanyConfigRecord | null> {
  const id = resolveStorefrontCompanyId(companyId);
  const dto = await publicStoreRequest<StorefrontConfigDto>(
    `/public/store/companies/${id}/config`,
    { nullOn404: true },
  );
  if (!dto?.settings) return null;
  return mapStorefrontConfigDtoToRecord({
    ...dto,
    settings: { ...dto.settings, companyId: dto.settings.companyId || id },
  });
}

/**
 * HTTP-only company config (store-frontend-binding.md §3 / §7).
 * No mock / seed fallback.
 */
export const storefrontCompanyRepository: CompanyStorefrontPort & CompanyCmsPort = {
  async getByCompanyId(
    companyId: string,
    locale: StorefrontLocale,
  ): Promise<StorefrontCompanyConfig | null> {
    if (!isStoreHttpEnabled()) return null;
    try {
      const httpRecord = await fetchPublicConfigRecord(companyId);
      if (!httpRecord) return null;
      return mapStorefrontCompanyConfig(httpRecord, locale);
    } catch (error) {
      if (error instanceof StoreHttpError && error.status === 404) return null;
      throw error;
    }
  },

  async getRecordByCompanyId(companyId: string): Promise<CompanyConfigRecord | null> {
    if (!isStoreHttpEnabled()) return null;
    const admin = await fetchAdminStoreConfig(companyId);
    if (admin) return admin;
    return fetchPublicConfigRecord(companyId);
  },

  async saveRecord(record: CompanyConfigRecord): Promise<CompanyConfigRecord> {
    if (!isStoreHttpEnabled()) {
      throw new Error('STORE_HTTP_DISABLED');
    }
    return saveAdminStoreConfig(record);
  },
};
