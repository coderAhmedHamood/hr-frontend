import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

export type CatalogUomCategory = 'countable' | 'bulk';

export type CatalogUom = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  uneceCode?: string | null;
  packagingType: 'unit' | 'pack' | 'box' | 'pallet' | 'other';
  category: CatalogUomCategory;
  displayOrder: number;
  isActive: boolean;
};

type CatalogUomDto = CatalogUom;

function mapCatalogUom(dto: CatalogUomDto): CatalogUom {
  return { ...dto };
}

export type CatalogUomListQuery = {
  companyId?: string;
  search?: string;
  page?: number;
  limit?: number;
  ensureDefaults?: boolean;
};

export async function listCatalogUoms(
  query: CatalogUomListQuery,
): Promise<PaginatedResult<CatalogUom>> {
  const params = new URLSearchParams();
  if (query.companyId) params.set('companyId', resolveStorefrontCompanyId(query.companyId));
  if (query.search) params.set('search', query.search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.ensureDefaults) params.set('ensureDefaults', 'true');

  const dto = await apiRequest<PaginatedResult<CatalogUomDto>>(
    `/inventory/catalog-uoms?${params.toString()}`,
  );
  return { ...dto, items: dto.items.map(mapCatalogUom) };
}

export async function createCatalogUom(input: {
  companyId: string;
  code?: string;
  nameAr: string;
  nameEn?: string | null;
  packagingType?: CatalogUom['packagingType'];
  category?: CatalogUomCategory;
}): Promise<CatalogUom> {
  const dto = await apiRequest<CatalogUomDto>('/inventory/catalog-uoms', {
    method: 'POST',
    body: {
      companyId: resolveStorefrontCompanyId(input.companyId),
      code: input.code,
      nameAr: input.nameAr,
      nameEn: input.nameEn ?? null,
      packagingType: input.packagingType ?? 'unit',
      category: input.category ?? 'countable',
    },
  });
  return mapCatalogUom(dto);
}

export async function updateCatalogUom(
  id: string,
  patch: Partial<{
    nameAr: string;
    nameEn: string | null;
    code: string;
    uneceCode: string | null;
    packagingType: CatalogUom['packagingType'];
    category: CatalogUomCategory;
    displayOrder: number;
    isActive: boolean;
  }>,
): Promise<CatalogUom> {
  const dto = await apiRequest<CatalogUomDto>(`/inventory/catalog-uoms/${id}`, {
    method: 'PATCH',
    body: patch,
  });
  return mapCatalogUom(dto);
}

export async function deleteCatalogUom(id: string): Promise<void> {
  await apiRequest<void>(`/inventory/catalog-uoms/${id}`, { method: 'DELETE' });
}
