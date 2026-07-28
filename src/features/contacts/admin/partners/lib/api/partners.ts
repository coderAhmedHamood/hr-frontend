import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  CreatePartnerInput,
  Partner,
  PartnerCategory,
  PartnerFull,
  PartnerListQuery,
  UpdatePartnerInput,
} from '@/features/contacts/domain/types/partner';
import {
  mapPartner,
  mapPartnerFull,
  partnerListQueryParams,
  toPartnerCreateBody,
  toPartnerUpdateBody,
} from '@/features/contacts/admin/partners/lib/api/partner-mappers';
import {
  partnerAddressesApi,
  partnerCategoryMembersApi,
  partnerChannelsApi,
  partnerRelationsApi,
} from '@/features/contacts/admin/partners/lib/api/partner-nested';
import { partnerCategoriesApi } from '@/features/contacts/admin/partners/lib/api/partner-categories';

export const partnersApi = {
  async getAll(query: PartnerListQuery) {
    const result = await apiRequest<PaginatedResult<Partner>>('/contacts/partners', {
      query: partnerListQueryParams(query),
    });
    return {
      items: (result.items ?? []).map(mapPartner),
      pagination: result.pagination,
    };
  },

  async getById(id: string) {
    try {
      const dto = await apiRequest<Partner>(`/contacts/partners/${id}`);
      return dto?.id ? mapPartner(dto) : null;
    } catch {
      return null;
    }
  },

  /**
   * Compose detail graph — backend has no `/full` yet (`contacts-api.md`).
   * Loads partner + addresses + channels + relations + category memberships in parallel.
   */
  async getFull(id: string, companyId?: string) {
    try {
      const base = await apiRequest<Partner>(`/contacts/partners/${id}`);
      if (!base?.id) return null;

      const partner = mapPartner(base);
      const [addresses, channels, relations, memberships, children] = await Promise.all([
        partnerAddressesApi.getAll(id).catch(() => []),
        partnerChannelsApi.getAll(id).catch(() => []),
        partnerRelationsApi.getAll(id).catch(() => []),
        partnerCategoryMembersApi.getAll(id).catch(() => []),
        partnersApi
          .getAll({
            companyId: companyId || partner.companyId,
            parentId: id,
            page: 1,
            limit: 1,
            archiveScope: 'active',
          })
          .catch(() => ({ items: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0 } })),
      ]);

      const categoryIds = memberships.map((m) => m.categoryId);
      let categories: PartnerCategory[] = [];
      if (categoryIds.length && (companyId || partner.companyId)) {
        const allCats = await partnerCategoriesApi
          .getAll({
            companyId: companyId || partner.companyId,
            page: 1,
            limit: 200,
            archiveScope: 'active',
          })
          .catch(() => ({ items: [] as PartnerCategory[] }));
        const byId = new Map(allCats.items.map((c) => [c.id, c]));
        categories = categoryIds.map((cid) => byId.get(cid)).filter(Boolean) as PartnerCategory[];
      }

      return mapPartnerFull({
        ...partner,
        addresses,
        channels,
        relations,
        categories,
        childrenCount: children.pagination.total,
      } as PartnerFull);
    } catch {
      return null;
    }
  },

  async getChildren(parentId: string, companyId: string, query?: { page?: number; limit?: number }) {
    return partnersApi.getAll({
      companyId,
      parentId,
      page: query?.page ?? 1,
      limit: query?.limit ?? 100,
      archiveScope: 'active',
    });
  },

  async create(input: CreatePartnerInput) {
    const dto = await apiRequest<Partner>('/contacts/partners', {
      method: 'POST',
      body: toPartnerCreateBody(input),
    });
    return mapPartner(dto);
  },

  async update(id: string, patch: UpdatePartnerInput) {
    const dto = await apiRequest<Partner>(`/contacts/partners/${id}`, {
      method: 'PATCH',
      body: toPartnerUpdateBody(patch),
    });
    return dto?.id ? mapPartner(dto) : null;
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partners/${id}`, { method: 'DELETE' });
    return true;
  },

  async assignCategory(partnerId: string, categoryId: string) {
    await partnerCategoryMembersApi.create({ partnerId, categoryId });
    return true;
  },

  async unassignCategory(partnerId: string, categoryId: string) {
    await partnerCategoryMembersApi.remove(partnerId, categoryId);
    return true;
  },
};
