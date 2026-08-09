import {
  publicStoreRequest,
  unwrapStoreList,
} from '@/features/ecommerce/storefront/lib/api/store-http';

/** Public storefront geo option — only showInStore + active + non-archived. */
export type PublicGeoOption = {
  id: string;
  code?: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
};

function sortOptions(items: PublicGeoOption[]): PublicGeoOption[] {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.nameAr.localeCompare(b.nameAr, 'ar');
  });
}

function unwrapGeoOptions(data: unknown): PublicGeoOption[] {
  if (Array.isArray(data)) return sortOptions(data as PublicGeoOption[]);
  return sortOptions(unwrapStoreList<PublicGeoOption>(data).items);
}

/** GET /public/store/geo/countries|cities|districts — no token. */
export const publicStoreGeoApi = {
  async listCountries(companyId: string): Promise<PublicGeoOption[]> {
    if (!companyId) return [];
    const data = await publicStoreRequest<unknown>('/public/store/geo/countries', {
      query: { companyId },
      nullOn404: true,
    });
    return unwrapGeoOptions(data);
  },

  async listCities(companyId: string, countryId: string): Promise<PublicGeoOption[]> {
    if (!companyId || !countryId) return [];
    const data = await publicStoreRequest<unknown>('/public/store/geo/cities', {
      query: { companyId, countryId },
      nullOn404: true,
    });
    return unwrapGeoOptions(data);
  },

  async listDistricts(companyId: string, cityId: string): Promise<PublicGeoOption[]> {
    if (!companyId || !cityId) return [];
    const data = await publicStoreRequest<unknown>('/public/store/geo/districts', {
      query: { companyId, cityId },
      nullOn404: true,
    });
    return unwrapGeoOptions(data);
  },
};
