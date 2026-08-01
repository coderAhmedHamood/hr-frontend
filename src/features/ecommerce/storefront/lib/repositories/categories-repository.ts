import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import type { StorefrontLocale } from '@/i18n/routing';
import type { StorefrontCategory, StorefrontPaginated } from '@/features/ecommerce/storefront/domain/storefront-models';
import type {
  StorefrontCategoriesPort,
  StorefrontCategoryListQuery,
} from '@/features/ecommerce/storefront/domain/catalog-ports';
import {
  mapCategory,
  type CategoryDto,
} from '@/features/ecommerce/admin/categories/lib/api/categories';
import { logStorefrontApi } from '@/features/ecommerce/storefront/lib/debug-storefront-api';
import { mapStorefrontCategories, mapStorefrontCategory } from '@/features/ecommerce/storefront/lib/mappers/category-mapper';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

type PaginatedCategoryDto = {
  items: CategoryDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function unwrapEnvelope<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { status?: number; data?: T; error?: unknown };
  const statusOk =
    typeof record.status === 'number' && record.status >= 200 && record.status < 300;
  if (statusOk && 'data' in record && record.data != null && record.error == null) {
    return record.data;
  }
  return payload as T;
}

async function publicCategoryRequest<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined>,
): Promise<T | null> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  const base = resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
  const url = `${base}${path}${qs ? `?${qs}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      logStorefrontApi({ url, status: response.status, ok: false });
      return null;
    }
    const payload: unknown = await response.json();
    const data = unwrapEnvelope<T>(payload);
    logStorefrontApi({ url, status: response.status, ok: true, data });
    return data;
  } catch (error) {
    logStorefrontApi({ url, ok: false, error });
    return null;
  }
}

/** StorefrontCategoriesPort — public inventory categories API (no auth). */
export const storefrontCategoriesRepository: StorefrontCategoriesPort = {
  async list(query: StorefrontCategoryListQuery): Promise<StorefrontPaginated<StorefrontCategory>> {
    const { locale, companyId, search, parentId, page, limit } = query;
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const result = await publicCategoryRequest<PaginatedCategoryDto>(
      '/public/inventory/categories',
      {
        companyId: resolvedCompanyId,
        search,
        parentId: parentId === null ? undefined : parentId,
        rootOnly: parentId === null ? true : undefined,
        page: page ?? 1,
        limit: limit ?? 200,
      },
    );

    const items = (result?.items ?? []).map(mapCategory);
    return {
      items: mapStorefrontCategories(items, locale),
      pagination: result?.pagination ?? {
        page: page ?? 1,
        limit: limit ?? 200,
        total: 0,
        totalPages: 0,
      },
    };
  },

  async getBySlug(
    companyId: string,
    slug: string,
    locale: StorefrontLocale,
  ): Promise<StorefrontCategory | null> {
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const dto = await publicCategoryRequest<CategoryDto>(
      `/public/inventory/categories/by-slug/${encodeURIComponent(slug)}`,
      { companyId: resolvedCompanyId },
    );
    if (!dto?.id || !dto.isActive) return null;
    return mapStorefrontCategory(mapCategory(dto), locale);
  },

  async getById(
    companyId: string,
    id: string,
    locale: StorefrontLocale,
  ): Promise<StorefrontCategory | null> {
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const result = await publicCategoryRequest<PaginatedCategoryDto>(
      '/public/inventory/categories',
      { companyId: resolvedCompanyId, id, page: 1, limit: 1 },
    );
    const dto = result?.items?.[0];
    if (!dto?.id || !dto.isActive) return null;
    return mapStorefrontCategory(mapCategory(dto), locale);
  },
};
