import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  CreatePartnerCategoryInput,
  PartnerCategory,
  PartnerCategoryListQuery,
  UpdatePartnerCategoryInput,
} from '@/features/contacts/domain/types/partner';

function mapCategory(dto: PartnerCategory): PartnerCategory {
  return {
    id: dto.id,
    companyId: dto.companyId,
    slug: dto.slug,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? null,
    color: dto.color ?? null,
    description: dto.description ?? null,
    isActive: dto.isActive ?? true,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export const partnerCategoriesApi = {
  async getAll(query: PartnerCategoryListQuery) {
    const result = await apiRequest<PaginatedResult<PartnerCategory>>('/contacts/partner-categories', {
      query: {
        companyId: query.companyId,
        search: query.search,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: query.archiveScope ?? 'active',
      },
    });
    return {
      items: (result.items ?? []).map(mapCategory),
      pagination: result.pagination,
    };
  },

  async create(input: CreatePartnerCategoryInput) {
    const body: Record<string, unknown> = {
      companyId: input.companyId,
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn?.trim() || null,
      color: input.color?.trim() || null,
      description: input.description?.trim() || null,
      isActive: input.isActive ?? true,
    };
    // slug اختياري — الـ Backend يشتقه من nameAr إن غاب
    if (input.slug?.trim()) body.slug = input.slug.trim();
    const dto = await apiRequest<PartnerCategory>('/contacts/partner-categories', {
      method: 'POST',
      body,
    });
    return mapCategory(dto);
  },

  async update(id: string, patch: UpdatePartnerCategoryInput) {
    const body: Record<string, unknown> = {};
    if (patch.slug !== undefined) body.slug = patch.slug?.trim() || null;
    if (patch.nameAr !== undefined) body.nameAr = patch.nameAr.trim();
    if (patch.nameEn !== undefined) body.nameEn = patch.nameEn?.trim() || null;
    if (patch.color !== undefined) body.color = patch.color?.trim() || null;
    if (patch.description !== undefined) body.description = patch.description?.trim() || null;
    if (patch.isActive !== undefined) body.isActive = patch.isActive;
    const dto = await apiRequest<PartnerCategory>(`/contacts/partner-categories/${id}`, {
      method: 'PATCH',
      body,
    });
    return dto?.id ? mapCategory(dto) : null;
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partner-categories/${id}`, { method: 'DELETE' });
    return true;
  },
};
