import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type {
  Brand,
  BrandListQuery,
  CreateBrandInput,
  UpdateBrandInput,
} from '@/features/ecommerce/domain/types/brand';
import type { AdminBrandsPort } from '@/features/ecommerce/domain/ports/catalog.ports';

type BrandDto = {
  id: string;
  companyId: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  logoAlt?: string | null;
  websiteUrl?: string | null;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  seoCanonicalPath?: string | null;
  seoOgImage?: string | null;
  seoKeywords?: string[] | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapBrand(dto: BrandDto): Brand {
  return {
    id: dto.id,
    companyId: dto.companyId,
    slug: dto.slug,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? undefined,
    description: dto.description ?? undefined,
    logo: dto.logoUrl
      ? {
          id: `${dto.id}-logo`,
          url: dto.logoUrl,
          alt: dto.logoAlt ?? '',
          type: 'image',
          position: 0,
          isPrimary: true,
        }
      : undefined,
    websiteUrl: dto.websiteUrl ?? undefined,
    seo: {
      metaTitle: dto.seoMetaTitle ?? undefined,
      metaDescription: dto.seoMetaDescription ?? undefined,
      canonicalPath: dto.seoCanonicalPath ?? undefined,
      ogImage: dto.seoOgImage ?? undefined,
      keywords: dto.seoKeywords ?? undefined,
    },
    isActive: dto.isActive,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function toCreateBody(input: CreateBrandInput) {
  return {
    companyId: resolveStorefrontCompanyId(input.companyId),
    slug: input.slug || undefined,
    nameAr: input.nameAr,
    nameEn: input.nameEn ?? null,
    description: input.description ?? null,
    logoUrl: input.logo?.url ?? null,
    logoAlt: input.logo?.alt ?? null,
    websiteUrl: input.websiteUrl ?? null,
    seoMetaTitle: input.seo?.metaTitle ?? null,
    seoMetaDescription: input.seo?.metaDescription ?? null,
    seoCanonicalPath: input.seo?.canonicalPath ?? null,
    seoOgImage: input.seo?.ogImage ?? null,
    seoKeywords: input.seo?.keywords ?? null,
    isActive: input.isActive,
  };
}

function toUpdateBody(patch: UpdateBrandInput) {
  const body: Record<string, unknown> = {};
  if (patch.slug !== undefined && patch.slug.trim()) body.slug = patch.slug.trim();
  if (patch.nameAr !== undefined) body.nameAr = patch.nameAr;
  if (patch.nameEn !== undefined) body.nameEn = patch.nameEn ?? null;
  if (patch.description !== undefined) body.description = patch.description ?? null;
  if (patch.logo !== undefined) {
    body.logoUrl = patch.logo?.url ?? null;
    body.logoAlt = patch.logo?.alt ?? null;
  }
  if (patch.websiteUrl !== undefined) body.websiteUrl = patch.websiteUrl ?? null;
  if (patch.seo !== undefined) {
    body.seoMetaTitle = patch.seo.metaTitle ?? null;
    body.seoMetaDescription = patch.seo.metaDescription ?? null;
    body.seoCanonicalPath = patch.seo.canonicalPath ?? null;
    body.seoOgImage = patch.seo.ogImage ?? null;
    body.seoKeywords = patch.seo.keywords ?? null;
  }
  if (patch.isActive !== undefined) body.isActive = patch.isActive;
  return body;
}

export const brandsApi: AdminBrandsPort = {
  async getAll(query: BrandListQuery): Promise<PaginatedResult<Brand>> {
    const companyId = resolveStorefrontCompanyId(query.companyId);
    const result = await apiRequest<PaginatedResult<BrandDto>>('/inventory/brands', {
      query: {
        companyId,
        search: query.search,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: 'active',
      },
    });
    return {
      items: (result.items ?? []).map(mapBrand),
      pagination: result.pagination,
    };
  },

  async getById(_companyId, id) {
    try {
      const dto = await apiRequest<BrandDto>(`/inventory/brands/${id}`);
      return dto?.id ? mapBrand(dto) : null;
    } catch {
      return null;
    }
  },

  async getBySlug(companyId, slug) {
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const result = await apiRequest<PaginatedResult<BrandDto>>('/inventory/brands', {
      query: {
        companyId: resolvedCompanyId,
        slug,
        page: 1,
        limit: 1,
        archiveScope: 'active',
      },
    });
    const dto = result.items?.[0];
    return dto ? mapBrand(dto) : null;
  },

  async create(input: CreateBrandInput) {
    const dto = await apiRequest<BrandDto>('/inventory/brands', {
      method: 'POST',
      body: toCreateBody(input),
    });
    return mapBrand(dto);
  },

  async update(_companyId, id, patch: UpdateBrandInput) {
    const dto = await apiRequest<BrandDto>(`/inventory/brands/${id}`, {
      method: 'PATCH',
      body: toUpdateBody(patch),
    });
    return dto?.id ? mapBrand(dto) : null;
  },

  async remove(_companyId, id) {
    await apiRequest<void>(`/inventory/brands/${id}`, { method: 'DELETE' });
    return true;
  },
};

/** Shared mapper for storefront public DTO → domain Brand. */
export { mapBrand };
export type { BrandDto };
