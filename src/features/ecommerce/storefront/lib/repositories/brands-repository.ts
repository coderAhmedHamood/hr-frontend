import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import type { StorefrontLocale } from '@/i18n/routing';
import type { StorefrontBrand, StorefrontPaginated } from '@/features/ecommerce/storefront/domain/storefront-models';
import type {
  StorefrontBrandListQuery,
  StorefrontBrandsPort,
} from '@/features/ecommerce/storefront/domain/catalog-ports';
import {
  mapBrand,
  type BrandDto,
} from '@/features/ecommerce/admin/brands/lib/api/brands';
import { logStorefrontApi } from '@/features/ecommerce/storefront/lib/debug-storefront-api';
import { storefrontPublicFetchInit } from '@/features/ecommerce/storefront/lib/api/store-http';
import { mapStorefrontBrand, mapStorefrontBrands } from '@/features/ecommerce/storefront/lib/mappers/brand-mapper';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

type PaginatedBrandDto = {
  items: BrandDto[];
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

async function publicBrandRequest<T>(
  path: string,
  query: Record<string, string | number | undefined>,
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
      ...storefrontPublicFetchInit('GET'),
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

/** StorefrontBrandsPort — public inventory brands API (no auth). */
export const storefrontBrandsRepository: StorefrontBrandsPort = {
  async list(query: StorefrontBrandListQuery): Promise<StorefrontPaginated<StorefrontBrand>> {
    const { locale, companyId, search, page, limit } = query;
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const result = await publicBrandRequest<PaginatedBrandDto>('/public/inventory/brands', {
      companyId: resolvedCompanyId,
      search,
      page: page ?? 1,
      limit: limit ?? 50,
    });

    const items = (result?.items ?? []).map(mapBrand);
    return {
      items: mapStorefrontBrands(items, locale),
      pagination: result?.pagination ?? {
        page: page ?? 1,
        limit: limit ?? 50,
        total: 0,
        totalPages: 0,
      },
    };
  },

  async getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontBrand | null> {
    const resolvedCompanyId = resolveStorefrontCompanyId(companyId);
    const dto = await publicBrandRequest<BrandDto>(
      `/public/inventory/brands/by-slug/${encodeURIComponent(slug)}`,
      { companyId: resolvedCompanyId },
    );
    if (!dto?.id || !dto.isActive) return null;
    return mapStorefrontBrand(mapBrand(dto), locale);
  },
};
