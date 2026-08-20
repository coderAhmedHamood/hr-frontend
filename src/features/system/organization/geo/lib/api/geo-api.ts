import {
  ApiError,
  apiRequest,
  ensurePaginatedResult,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';

export type ArchiveScope = 'active' | 'archived' | 'all';

export type GeoCountry = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
  showInStore: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type GeoCity = {
  id: string;
  companyId: string;
  countryId: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
  showInStore: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type GeoDistrict = {
  id: string;
  companyId: string;
  cityId: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
  showInStore: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type GeoListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  search?: string;
  archiveScope?: ArchiveScope;
  isActive?: boolean;
  showInStore?: boolean;
  countryId?: string;
  cityId?: string;
};

export type CreateGeoCountryInput = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  showInStore?: boolean;
};

export type CreateGeoCityInput = {
  companyId: string;
  countryId: string;
  nameAr: string;
  nameEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  showInStore?: boolean;
};

export type CreateGeoDistrictInput = {
  companyId: string;
  cityId: string;
  nameAr: string;
  nameEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  showInStore?: boolean;
};

export type UpdateGeoCountryInput = Partial<
  Omit<CreateGeoCountryInput, 'companyId'>
>;
export type UpdateGeoCityInput = Partial<Omit<CreateGeoCityInput, 'companyId'>>;
export type UpdateGeoDistrictInput = Partial<Omit<CreateGeoDistrictInput, 'companyId'>>;

/** Link row: company ↔ supported country code (`company_geo_countries`). */
export type CompanyGeoCountry = {
  id: string;
  companyId: string;
  countryCode: string;
  showInStore: boolean;
  /** Present when the API joins catalog country fields. */
  nameAr?: string | null;
  nameEn?: string | null;
  countryId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateCompanyGeoCountryInput = {
  showInStore?: boolean;
};

function normalizeCompanyGeoCountryList(
  value: PaginatedResult<CompanyGeoCountry> | CompanyGeoCountry[] | null | undefined,
): CompanyGeoCountry[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return ensurePaginatedResult(value).items;
}

function listQuery(query: GeoListQuery) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    companyId: query.companyId || undefined,
    search: query.search?.trim() || undefined,
    archiveScope: query.archiveScope ?? 'active',
    isActive: query.isActive,
    showInStore: query.showInStore,
    countryId: query.countryId || undefined,
    cityId: query.cityId || undefined,
  };
}

/** Staff CRUD — `/geo/countries|cities|districts` */
export const geoCountriesApi = {
  async list(query: GeoListQuery = {}): Promise<PaginatedResult<GeoCountry>> {
    const result = await apiRequest<PaginatedResult<GeoCountry>>('/geo/countries', {
      query: listQuery(query),
      throwOnError: true,
    });
    return ensurePaginatedResult(result);
  },

  async update(
    id: string,
    patch: UpdateGeoCountryInput,
    options?: { silent?: boolean },
  ): Promise<GeoCountry> {
    return apiRequest<GeoCountry>(`/geo/countries/${id}`, {
      method: 'PATCH',
      throwOnError: true,
      silent: options?.silent,
      body: {
        ...patch,
        ...(patch.code !== undefined ? { code: patch.code.trim().toUpperCase() } : {}),
        ...(patch.nameAr !== undefined ? { nameAr: patch.nameAr.trim() } : {}),
        ...(patch.nameEn !== undefined ? { nameEn: patch.nameEn?.trim() || null } : {}),
      },
    });
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/geo/countries/${id}`, { method: 'DELETE', throwOnError: true });
  },
};

export const geoCitiesApi = {
  async list(query: GeoListQuery = {}): Promise<PaginatedResult<GeoCity>> {
    const result = await apiRequest<PaginatedResult<GeoCity>>('/geo/cities', {
      query: listQuery(query),
      throwOnError: true,
    });
    return ensurePaginatedResult(result);
  },

  async create(input: CreateGeoCityInput): Promise<GeoCity> {
    return apiRequest<GeoCity>('/geo/cities', {
      method: 'POST',
      throwOnError: true,
      body: {
        companyId: input.companyId,
        countryId: input.countryId,
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        showInStore: input.showInStore ?? false,
      },
    });
  },

  async update(id: string, patch: UpdateGeoCityInput, options?: { silent?: boolean }): Promise<GeoCity> {
    return apiRequest<GeoCity>(`/geo/cities/${id}`, {
      method: 'PATCH',
      throwOnError: true,
      silent: options?.silent,
      body: {
        ...patch,
        ...(patch.nameAr !== undefined ? { nameAr: patch.nameAr.trim() } : {}),
        ...(patch.nameEn !== undefined ? { nameEn: patch.nameEn?.trim() || null } : {}),
      },
    });
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/geo/cities/${id}`, { method: 'DELETE', throwOnError: true });
  },

  /** POST /geo/cities/:id/restore — clears archivedAt, sets isActive=true */
  async restore(id: string, body?: { updatedBy?: string }): Promise<GeoCity> {
    return apiRequest<GeoCity>(`/geo/cities/${id}/restore`, {
      method: 'POST',
      throwOnError: true,
      body: body?.updatedBy ? { updatedBy: body.updatedBy } : {},
    });
  },
};

export const geoDistrictsApi = {
  async list(query: GeoListQuery = {}): Promise<PaginatedResult<GeoDistrict>> {
    const result = await apiRequest<PaginatedResult<GeoDistrict>>('/geo/districts', {
      query: listQuery(query),
      throwOnError: true,
    });
    return ensurePaginatedResult(result);
  },

  async create(input: CreateGeoDistrictInput): Promise<GeoDistrict> {
    return apiRequest<GeoDistrict>('/geo/districts', {
      method: 'POST',
      throwOnError: true,
      body: {
        companyId: input.companyId,
        cityId: input.cityId,
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        showInStore: input.showInStore ?? false,
      },
    });
  },

  async update(
    id: string,
    patch: UpdateGeoDistrictInput,
    options?: { silent?: boolean },
  ): Promise<GeoDistrict> {
    return apiRequest<GeoDistrict>(`/geo/districts/${id}`, {
      method: 'PATCH',
      throwOnError: true,
      silent: options?.silent,
      body: {
        ...patch,
        ...(patch.nameAr !== undefined ? { nameAr: patch.nameAr.trim() } : {}),
        ...(patch.nameEn !== undefined ? { nameEn: patch.nameEn?.trim() || null } : {}),
      },
    });
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/geo/districts/${id}`, { method: 'DELETE', throwOnError: true });
  },

  /** POST /geo/districts/:id/restore — clears archivedAt, sets isActive=true */
  async restore(id: string, body?: { updatedBy?: string }): Promise<GeoDistrict> {
    return apiRequest<GeoDistrict>(`/geo/districts/${id}/restore`, {
      method: 'POST',
      throwOnError: true,
      body: body?.updatedBy ? { updatedBy: body.updatedBy } : {},
    });
  },
};

/**
 * Company ↔ country support links.
 * Catalog (`/geo/countries`) is the tree; these rows decide which country codes
 * this company supports and whether they appear in the public store.
 */
export const geoCompanyCountriesApi = {
  async list(companyId: string): Promise<CompanyGeoCountry[]> {
    const result = await apiRequest<
      PaginatedResult<CompanyGeoCountry> | CompanyGeoCountry[]
    >('/geo/company-countries', {
      query: { companyId },
      throwOnError: true,
    });
    return normalizeCompanyGeoCountryList(result);
  },

  async update(
    id: string,
    patch: UpdateCompanyGeoCountryInput,
    options?: { silent?: boolean },
  ): Promise<CompanyGeoCountry> {
    return apiRequest<CompanyGeoCountry>(`/geo/company-countries/${id}`, {
      method: 'PATCH',
      throwOnError: true,
      silent: options?.silent,
      body: patch,
    });
  },
};

/** Store checkout requires isActive + showInStore together. */
export function geoStoreVisibilityPatch(showInStore: boolean): {
  showInStore: boolean;
  isActive?: boolean;
} {
  return showInStore ? { showInStore: true, isActive: true } : { showInStore: false };
}

/** Activate catalog rows already marked showInStore so public /store/geo/* lists them. */
async function activateStoreVisibleCatalog(companyId: string, countryCode: string): Promise<void> {
  const code = countryCode.trim().toUpperCase();
  const countries = await geoCountriesApi.list({ companyId, limit: 200, archiveScope: 'active' });
  const country = countries.items.find((row) => row.code.trim().toUpperCase() === code);
  if (!country) return;

  if (!country.isActive || !country.showInStore) {
    await geoCountriesApi.update(country.id, { isActive: true, showInStore: true }, { silent: true });
  }

  const cities = await geoCitiesApi.list({
    companyId,
    countryId: country.id,
    limit: 500,
    archiveScope: 'active',
  });

  await Promise.all(
    cities.items
      .filter((row) => row.showInStore && !row.isActive)
      .map((row) => geoCitiesApi.update(row.id, { isActive: true }, { silent: true })),
  );

  for (const city of cities.items.filter((row) => row.showInStore)) {
    const districts = await geoDistrictsApi.list({
      companyId,
      cityId: city.id,
      limit: 500,
      archiveScope: 'active',
    });
    await Promise.all(
      districts.items
        .filter((row) => row.showInStore && !row.isActive)
        .map((row) => geoDistrictsApi.update(row.id, { isActive: true }, { silent: true })),
    );
  }
}

/**
 * تفعيل / إلغاء دولة الشركة بالمتجر.
 * المسار الرسمي: PATCH /geo/company-countries/:id { showInStore }
 * الباكند يزامِن الكتالوج. إن رجع 404 من cascade قديم ونجح الربط فعلياً نعتبره نجاحاً.
 */
export async function setCompanyCountryStoreVisibility(input: {
  companyId: string;
  linkId: string;
  countryCode: string;
  showInStore: boolean;
}): Promise<CompanyGeoCountry> {
  let link: CompanyGeoCountry;
  try {
    link = await geoCompanyCountriesApi.update(
      input.linkId,
      { showInStore: input.showInStore },
      { silent: true },
    );
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;

    // بعض إصدارات الباكند كانت ترمي 404 من مزامنة ابن تالف بعد تحديث الربط.
    const links = await geoCompanyCountriesApi.list(input.companyId);
    const recovered = links.find((row) => row.id === input.linkId);
    if (recovered && recovered.showInStore === input.showInStore) {
      link = recovered;
    } else {
      throw error;
    }
  }

  if (input.showInStore) {
    await activateStoreVisibleCatalog(input.companyId, input.countryCode);
  }

  return link;
}
