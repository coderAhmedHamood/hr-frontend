import { apiRequest, ApiError } from '@/features/hr/lib/api/client';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type { SectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import type { DataSourceConfig } from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  isStoreHttpEnabled,
  publicStoreRequest,
} from '@/features/ecommerce/storefront/lib/api/store-http';
import { normalizeCmsSectionDto } from '@/features/ecommerce/storefront/page-builder/lib/normalize-cms-section-dto';

type CmsSectionDto = {
  id: string;
  sectionType: SectionRecord['type'];
  status: SectionRecord['status'];
  enabled: boolean;
  sortOrder: number;
  revision: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  style: Record<string, unknown>;
  dataSourceKind: DataSourceConfig['kind'];
  dataSource: Record<string, unknown>;
  publishedAt?: string | null;
  updatedAt: string;
};

type CmsPageDto = {
  id: string;
  companyId: string;
  pageType: PageRecord['pageType'];
  status: PageRecord['status'];
  slug?: string | null;
  titleAr: string;
  titleEn: string;
  revision: number;
  publishedAt?: string | null;
  sections: CmsSectionDto[];
  createdAt: string;
  updatedAt: string;
};

function mapSectionDto(dto: CmsSectionDto): SectionRecord {
  return normalizeCmsSectionDto(dto);
}

function mapPageDto(dto: CmsPageDto): PageRecord {
  return {
    id: dto.id,
    companyId: dto.companyId,
    pageType: dto.pageType,
    slug: dto.slug ?? 'home',
    schemaVersion: 1,
    contentVersion: dto.revision,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    publishedAt: dto.publishedAt ?? null,
    createdBy: null,
    updatedBy: null,
    displayName: { ar: dto.titleAr, en: dto.titleEn },
    sections: [...(dto.sections ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapSectionDto),
  };
}

function isCmsPageDto(value: unknown): value is CmsPageDto {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && Array.isArray(record.sections);
}

export async function fetchAdminHomepage(companyId: string): Promise<PageRecord | null> {
  if (!isStoreHttpEnabled()) return null;
  const id = resolveStorefrontCompanyId(companyId);
  try {
    const dto = await apiRequest<CmsPageDto>(`/store-admin/companies/${id}/pages/homepage`, {
      throwOnError: true,
    });
    if (!isCmsPageDto(dto)) return null;
    return mapPageDto(dto);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function saveAdminHomepage(record: PageRecord): Promise<PageRecord> {
  const id = resolveStorefrontCompanyId(record.companyId);
  const dto = await apiRequest<CmsPageDto>(`/store-admin/companies/${id}/pages/homepage`, {
    method: 'PUT',
    throwOnError: true,
    body: {
      status: record.status,
      titleAr: record.displayName.ar,
      titleEn: record.displayName.en,
      sections: record.sections.map((section, index) => ({
        sectionType: section.type,
        status: section.status,
        enabled: section.enabled,
        sortOrder: section.order ?? index,
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSourceKind: section.dataSource.kind,
        dataSource: section.dataSource,
      })),
    },
  });
  if (!isCmsPageDto(dto)) {
    throw new Error('HOMEPAGE_SAVE_INVALID_RESPONSE');
  }
  return mapPageDto(dto);
}

export async function fetchPublicHomepage(companyId: string): Promise<PageRecord | null> {
  if (!isStoreHttpEnabled()) return null;
  const dto = await publicStoreRequest<CmsPageDto>('/public/store/pages/homepage', {
    query: { companyId: resolveStorefrontCompanyId(companyId) },
    nullOn404: true,
  });
  return dto ? mapPageDto(dto) : null;
}
