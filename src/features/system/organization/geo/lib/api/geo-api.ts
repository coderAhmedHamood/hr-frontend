import { apiRequest, ensurePaginatedResult, type PaginatedResult } from '@/features/hr/lib/api/client';

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

  async create(input: CreateGeoCountryInput): Promise<GeoCountry> {
    return apiRequest<GeoCountry>('/geo/countries', {
      method: 'POST',
      throwOnError: true,
      body: {
        companyId: input.companyId,
        code: input.code.trim().toUpperCase(),
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        showInStore: input.showInStore ?? false,
      },
    });
  },

  async update(id: string, patch: UpdateGeoCountryInput): Promise<GeoCountry> {
    return apiRequest<GeoCountry>(`/geo/countries/${id}`, {
      method: 'PATCH',
      throwOnError: true,
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

  async update(id: string, patch: UpdateGeoCityInput): Promise<GeoCity> {
    return apiRequest<GeoCity>(`/geo/cities/${id}`, {
      method: 'PATCH',
      throwOnError: true,
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

  async update(id: string, patch: UpdateGeoDistrictInput): Promise<GeoDistrict> {
    return apiRequest<GeoDistrict>(`/geo/districts/${id}`, {
      method: 'PATCH',
      throwOnError: true,
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
};
