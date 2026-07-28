import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type {
  Category,
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/features/ecommerce/domain/types/category';
import type { AdminCategoriesPort } from '@/features/ecommerce/domain/ports/catalog.ports';
import type { WarehouseRemovalStrategy } from '@/features/inventory/domain/types/warehouse';
import type { CategoryPackageReservation } from '@/features/ecommerce/domain/types/category';

type CategoryDto = {
  id: string;
  companyId: string;
  parentId?: string | null;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  featuredBrandIds?: string[] | null;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  seoCanonicalPath?: string | null;
  seoOgImage?: string | null;
  seoKeywords?: string[] | null;
  displayOrder: number;
  isActive: boolean;
  logisticsRoutesNote?: string | null;
  logisticsRemovalStrategy?: WarehouseRemovalStrategy | null;
  logisticsPackageReservation?: CategoryPackageReservation | null;
  createdAt: string;
  updatedAt: string;
};

function mapCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    companyId: dto.companyId,
    parentId: dto.parentId ?? null,
    slug: dto.slug,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? undefined,
    description: dto.description ?? undefined,
    image: dto.imageUrl
      ? {
          id: `${dto.id}-image`,
          url: dto.imageUrl,
          alt: dto.imageAlt ?? '',
          type: 'image',
          position: 0,
          isPrimary: true,
        }
      : undefined,
    featuredBrandIds: dto.featuredBrandIds ?? undefined,
    seo: {
      metaTitle: dto.seoMetaTitle ?? undefined,
      metaDescription: dto.seoMetaDescription ?? undefined,
      canonicalPath: dto.seoCanonicalPath ?? undefined,
      ogImage: dto.seoOgImage ?? undefined,
      keywords: dto.seoKeywords ?? undefined,
    },
    displayOrder: dto.displayOrder,
    isActive: dto.isActive,
    logistics: {
      routesNote: dto.logisticsRoutesNote ?? undefined,
      removalStrategy: dto.logisticsRemovalStrategy ?? undefined,
      packageReservation: dto.logisticsPackageReservation ?? undefined,
    },
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function toCreateBody(input: CreateCategoryInput) {
  return {
    companyId: resolveStorefrontCompanyId(input.companyId),
    parentId: input.parentId ?? null,
    slug: input.slug || undefined,
    nameAr: input.nameAr,
    nameEn: input.nameEn ?? null,
    description: input.description ?? null,
    imageUrl: input.image?.url ?? null,
    imageAlt: input.image?.alt ?? null,
    featuredBrandIds: input.featuredBrandIds ?? null,
    seoMetaTitle: input.seo?.metaTitle ?? null,
    seoMetaDescription: input.seo?.metaDescription ?? null,
    seoCanonicalPath: input.seo?.canonicalPath ?? null,
    seoOgImage: input.seo?.ogImage ?? null,
    seoKeywords: input.seo?.keywords ?? null,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
    logisticsRoutesNote: input.logistics?.routesNote ?? null,
    logisticsRemovalStrategy: input.logistics?.removalStrategy ?? null,
    logisticsPackageReservation: input.logistics?.packageReservation ?? null,
  };
}

function toUpdateBody(patch: UpdateCategoryInput) {
  const body: Record<string, unknown> = {};
  if (patch.parentId !== undefined) body.parentId = patch.parentId;
  if (patch.slug !== undefined && patch.slug.trim()) body.slug = patch.slug.trim();
  if (patch.nameAr !== undefined) body.nameAr = patch.nameAr;
  if (patch.nameEn !== undefined) body.nameEn = patch.nameEn ?? null;
  if (patch.description !== undefined) body.description = patch.description ?? null;
  if (patch.image !== undefined) {
    body.imageUrl = patch.image?.url ?? null;
    body.imageAlt = patch.image?.alt ?? null;
  }
  if (patch.featuredBrandIds !== undefined) body.featuredBrandIds = patch.featuredBrandIds;
  if (patch.seo !== undefined) {
    body.seoMetaTitle = patch.seo.metaTitle ?? null;
    body.seoMetaDescription = patch.seo.metaDescription ?? null;
    body.seoCanonicalPath = patch.seo.canonicalPath ?? null;
    body.seoOgImage = patch.seo.ogImage ?? null;
    body.seoKeywords = patch.seo.keywords ?? null;
  }
  if (patch.displayOrder !== undefined) body.displayOrder = patch.displayOrder;
  if (patch.isActive !== undefined) body.isActive = patch.isActive;
  if (patch.logistics !== undefined) {
    body.logisticsRoutesNote = patch.logistics.routesNote ?? null;
    body.logisticsRemovalStrategy = patch.logistics.removalStrategy ?? null;
    body.logisticsPackageReservation = patch.logistics.packageReservation ?? null;
  }
  return body;
}

export const categoriesApi: AdminCategoriesPort = {
  async getAll(query: CategoryListQuery): Promise<PaginatedResult<Category>> {
    const companyId = resolveStorefrontCompanyId(query.companyId);
    const result = await apiRequest<PaginatedResult<CategoryDto>>('/inventory/categories', {
      query: {
        companyId,
        search: query.search,
        parentId: query.parentId === null ? undefined : query.parentId,
        rootOnly: query.parentId === null ? true : undefined,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: 'active',
      },
    });
    return {
      items: (result.items ?? []).map(mapCategory),
      pagination: result.pagination,
    };
  },

  async getById(_companyId, id) {
    try {
      const dto = await apiRequest<CategoryDto>(`/inventory/categories/${id}`);
      return dto?.id ? mapCategory(dto) : null;
    } catch {
      return null;
    }
  },

  async getBySlug(companyId, slug) {
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const result = await this.getAll({ companyId: resolvedCompanyId, page: 1, limit: 1 });
    const exact = await apiRequest<PaginatedResult<CategoryDto>>('/inventory/categories', {
      query: { companyId: resolvedCompanyId, slug, page: 1, limit: 1, archiveScope: 'active' },
    });
    const dto = exact.items?.[0];
    return dto ? mapCategory(dto) : result.items.find((item) => item.slug === slug) ?? null;
  },

  async create(input: CreateCategoryInput) {
    const dto = await apiRequest<CategoryDto>('/inventory/categories', {
      method: 'POST',
      body: toCreateBody(input),
    });
    return mapCategory(dto);
  },

  async update(_companyId, id, patch: UpdateCategoryInput) {
    const dto = await apiRequest<CategoryDto>(`/inventory/categories/${id}`, {
      method: 'PATCH',
      body: toUpdateBody(patch),
    });
    return dto?.id ? mapCategory(dto) : null;
  },

  async remove(_companyId, id) {
    await apiRequest<void>(`/inventory/categories/${id}`, { method: 'DELETE' });
    return true;
  },
};
