import {
  apiRequest,
  ensurePaginatedResult,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

export type DeliveryRateScopeType = 'city' | 'district';
export type ArchiveScope = 'active' | 'archived' | 'all';

export type DeliveryRateGeoRef = {
  id: string;
  nameAr: string;
  nameEn?: string | null;
};

export type StoreDeliveryRate = {
  id: string;
  companyId: string;
  countryId: string;
  name: string;
  scopeType: DeliveryRateScopeType;
  amount: string;
  currencyCode: string;
  cities: DeliveryRateGeoRef[];
  districts: DeliveryRateGeoRef[];
  sortOrder: number;
  isActive: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryRateListQuery = {
  page?: number;
  limit?: number;
  countryId?: string;
  scopeType?: DeliveryRateScopeType;
  isActive?: boolean;
  search?: string;
  archiveScope?: ArchiveScope;
};

export type CreateDeliveryRateInput = {
  countryId: string;
  name: string;
  scopeType: DeliveryRateScopeType;
  amount: number;
  currencyCode?: string;
  cityIds?: string[];
  districtIds?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateDeliveryRateInput = {
  name?: string;
  amount?: number;
  currencyCode?: string;
  cityIds?: string[];
  districtIds?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

function base(companyId: string) {
  return `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/delivery-rates`;
}

function listQuery(query: DeliveryRateListQuery) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    countryId: query.countryId || undefined,
    scopeType: query.scopeType,
    isActive: query.isActive,
    search: query.search?.trim() || undefined,
    archiveScope: query.archiveScope ?? 'active',
  };
}

export const deliveryRatesApi = {
  async list(
    companyId: string,
    query: DeliveryRateListQuery = {},
  ): Promise<PaginatedResult<StoreDeliveryRate>> {
    const result = await apiRequest<PaginatedResult<StoreDeliveryRate>>(base(companyId), {
      query: listQuery(query),
      throwOnError: true,
    });
    return ensurePaginatedResult(result);
  },

  async get(companyId: string, id: string): Promise<StoreDeliveryRate> {
    return apiRequest<StoreDeliveryRate>(`${base(companyId)}/${id}`, {
      throwOnError: true,
    });
  },

  async create(companyId: string, input: CreateDeliveryRateInput): Promise<StoreDeliveryRate> {
    return apiRequest<StoreDeliveryRate>(base(companyId), {
      method: 'POST',
      throwOnError: true,
      body: {
        countryId: input.countryId,
        name: input.name.trim(),
        scopeType: input.scopeType,
        amount: input.amount,
        ...(input.currencyCode ? { currencyCode: input.currencyCode } : {}),
        ...(input.scopeType === 'city' ? { cityIds: input.cityIds ?? [] } : {}),
        ...(input.scopeType === 'district' ? { districtIds: input.districtIds ?? [] } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  },

  async update(
    companyId: string,
    id: string,
    patch: UpdateDeliveryRateInput,
  ): Promise<StoreDeliveryRate> {
    return apiRequest<StoreDeliveryRate>(`${base(companyId)}/${id}`, {
      method: 'PATCH',
      throwOnError: true,
      body: {
        ...patch,
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      },
    });
  },

  async remove(companyId: string, id: string): Promise<void> {
    await apiRequest<void>(`${base(companyId)}/${id}`, {
      method: 'DELETE',
      throwOnError: true,
    });
  },

  async restore(companyId: string, id: string): Promise<StoreDeliveryRate> {
    return apiRequest<StoreDeliveryRate>(`${base(companyId)}/${id}/restore`, {
      method: 'POST',
      throwOnError: true,
      body: {},
    });
  },
};
