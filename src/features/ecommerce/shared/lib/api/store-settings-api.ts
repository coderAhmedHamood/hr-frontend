import { apiRequest, ApiError, ensurePaginatedResult } from '@/features/hr/lib/api/client';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  assembleStorefrontConfigDto,
  mapRecordToAnnouncementsPayload,
  mapRecordToCheckoutCitiesPayload,
  mapRecordToFooterPayload,
  mapRecordToNavItemsPayload,
  mapRecordToSocialLinksPayload,
  mapRecordToUpdateSettingsDto,
  mapStorefrontConfigDtoToRecord,
  type StoreAnnouncementItemDto,
  type StoreCheckoutCityDto,
  type StoreFooterLinkGroupDto,
  type StoreNavItemDto,
  type StoreSettingsDto,
  type StoreSocialLinkDto,
} from '@/features/ecommerce/storefront/lib/api/store-config-dto';
import { unwrapStoreList } from '@/features/ecommerce/storefront/lib/api/store-http';

function settingsBase(companyId: string) {
  return `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/settings`;
}

async function getOptionalSettings<T>(path: string): Promise<T | null> {
  try {
    return await apiRequest<T>(path, { throwOnError: true });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}

async function getListItems<T>(path: string): Promise<T[]> {
  try {
    const page = await apiRequest<unknown>(path, { throwOnError: true });
    return unwrapStoreList<T>(page).items;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return [];
    throw error;
  }
}

/** Load full company store config via store-admin (binding §7). */
export async function fetchAdminStoreConfig(companyId: string): Promise<CompanyConfigRecord | null> {
  const id = resolveStorefrontCompanyId(companyId);
  const settings = await getOptionalSettings<StoreSettingsDto>(settingsBase(id));
  if (!settings) return null;

  const [checkoutCities, socialLinks, navItems, footer, announcements] = await Promise.all([
    getListItems<StoreCheckoutCityDto>(`${settingsBase(id)}/checkout-cities`),
    getListItems<StoreSocialLinkDto>(`${settingsBase(id)}/social-links`),
    getListItems<StoreNavItemDto>(`${settingsBase(id)}/nav-items`),
    getListItems<StoreFooterLinkGroupDto>(`${settingsBase(id)}/footer`),
    getListItems<StoreAnnouncementItemDto>(`${settingsBase(id)}/announcements`),
  ]);

  const dto = assembleStorefrontConfigDto({
    settings: { ...settings, companyId: settings.companyId || id },
    checkoutCities,
    socialLinks,
    navItems,
    footerLinkGroups: footer,
    announcements,
  });
  return mapStorefrontConfigDtoToRecord(dto);
}

/** Persist full CompanyConfigRecord across store-admin settings endpoints. */
export async function saveAdminStoreConfig(record: CompanyConfigRecord): Promise<CompanyConfigRecord> {
  const id = resolveStorefrontCompanyId(record.id);
  const base = settingsBase(id);

  await apiRequest<StoreSettingsDto>(base, {
    method: 'PATCH',
    throwOnError: true,
    body: mapRecordToUpdateSettingsDto({ ...record, id }),
  });

  await Promise.all([
    apiRequest(`${base}/checkout-cities`, {
      method: 'PUT',
      throwOnError: true,
      body: mapRecordToCheckoutCitiesPayload(record),
    }),
    apiRequest(`${base}/social-links`, {
      method: 'PUT',
      throwOnError: true,
      body: mapRecordToSocialLinksPayload(record),
    }),
    apiRequest(`${base}/nav-items`, {
      method: 'PUT',
      throwOnError: true,
      body: mapRecordToNavItemsPayload(record),
    }),
    apiRequest(`${base}/footer`, {
      method: 'PUT',
      throwOnError: true,
      body: mapRecordToFooterPayload(record),
    }),
    apiRequest(`${base}/announcements`, {
      method: 'PUT',
      throwOnError: true,
      body: mapRecordToAnnouncementsPayload(record),
    }),
  ]);

  const saved = await fetchAdminStoreConfig(id);
  if (!saved) throw new Error('STORE_SETTINGS_RELOAD_FAILED');
  return saved;
}

export { ensurePaginatedResult };
