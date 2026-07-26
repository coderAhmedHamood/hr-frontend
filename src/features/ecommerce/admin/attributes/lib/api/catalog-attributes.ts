import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toOptionalNumber } from '@/features/inventory/lib/api/numbers';
import {
  normalizeAttributeValue,
  type CatalogAttribute,
  type CatalogAttributeListQuery,
  type CatalogAttributeValue,
  type CreateCatalogAttributeInput,
  type UpdateCatalogAttributeInput,
} from '@/features/ecommerce/domain/types/catalog-attribute';

type AttributeDto = {
  id: string;
  companyId: string;
  nameAr: string;
  displayType: CatalogAttribute['displayType'];
  createVariant: CatalogAttribute['createVariant'];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AttributeValueDto = {
  id: string;
  attributeId: string;
  companyId: string;
  nameAr: string;
  freeText?: string | null;
  defaultExtraPrice?: string | number | null;
  colorHex?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

function mapValue(dto: AttributeValueDto, displayType: CatalogAttribute['displayType']): CatalogAttributeValue {
  return normalizeAttributeValue(
    {
      id: dto.id,
      nameAr: dto.nameAr,
      freeText: dto.freeText ?? undefined,
      defaultExtraPrice: toOptionalNumber(dto.defaultExtraPrice),
      colorHex: dto.colorHex ?? undefined,
      imageUrl: dto.imageUrl ?? undefined,
    },
    displayType,
  );
}

async function fetchValues(attributeId: string, displayType: CatalogAttribute['displayType']) {
  const result = await apiRequest<PaginatedResult<AttributeValueDto>>(
    '/inventory/catalog-attribute-values',
    {
      query: {
        attributeId,
        page: 1,
        limit: 200,
        archiveScope: 'active',
      },
    },
  );
  return (result.items ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((dto) => mapValue(dto, displayType));
}

async function mapAttribute(dto: AttributeDto): Promise<CatalogAttribute> {
  const values = await fetchValues(dto.id, dto.displayType);
  return {
    id: dto.id,
    companyId: dto.companyId,
    nameAr: dto.nameAr,
    displayType: dto.displayType,
    createVariant: dto.createVariant,
    values,
    isActive: dto.isActive,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

async function syncValues(
  attributeId: string,
  displayType: CatalogAttribute['displayType'],
  nextValues: CatalogAttributeValue[],
): Promise<CatalogAttributeValue[]> {
  const existing = await fetchValues(attributeId, displayType);
  const existingById = new Map(existing.map((value) => [value.id, value]));
  const keepIds = new Set(nextValues.map((value) => value.id).filter((id) => existingById.has(id)));

  for (const value of existing) {
    if (!keepIds.has(value.id)) {
      await apiRequest<void>(`/inventory/catalog-attribute-values/${value.id}`, { method: 'DELETE' });
    }
  }

  const synced: CatalogAttributeValue[] = [];
  for (const [index, value] of nextValues.entries()) {
    const body = {
      nameAr: value.nameAr,
      freeText: value.freeText ?? null,
      defaultExtraPrice: value.defaultExtraPrice ?? null,
      colorHex: value.colorHex ?? null,
      imageUrl: value.imageUrl ?? null,
      sortOrder: index,
    };
    if (existingById.has(value.id)) {
      const dto = await apiRequest<AttributeValueDto>(
        `/inventory/catalog-attribute-values/${value.id}`,
        { method: 'PATCH', body },
      );
      synced.push(mapValue(dto, displayType));
    } else {
      const dto = await apiRequest<AttributeValueDto>('/inventory/catalog-attribute-values', {
        method: 'POST',
        body: { attributeId, ...body },
      });
      synced.push(mapValue(dto, displayType));
    }
  }
  return synced;
}

export const catalogAttributesApi = {
  async getAll(query: CatalogAttributeListQuery) {
    const result = await apiRequest<PaginatedResult<AttributeDto>>('/inventory/catalog-attributes', {
      query: {
        companyId: query.companyId,
        search: query.search,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: 'active',
      },
    });
    const items = await Promise.all((result.items ?? []).map(mapAttribute));
    return { items, pagination: result.pagination };
  },

  async getById(_companyId: string, id: string) {
    try {
      const dto = await apiRequest<AttributeDto>(`/inventory/catalog-attributes/${id}`);
      return dto?.id ? mapAttribute(dto) : null;
    } catch {
      return null;
    }
  },

  async create(input: CreateCatalogAttributeInput) {
    const dto = await apiRequest<AttributeDto>('/inventory/catalog-attributes', {
      method: 'POST',
      body: {
        companyId: input.companyId,
        nameAr: input.nameAr,
        displayType: input.displayType,
        createVariant: input.createVariant,
        isActive: input.isActive,
      },
    });
    const values = await syncValues(dto.id, dto.displayType, input.values ?? []);
    return {
      id: dto.id,
      companyId: dto.companyId,
      nameAr: dto.nameAr,
      displayType: dto.displayType,
      createVariant: dto.createVariant,
      values,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    } satisfies CatalogAttribute;
  },

  async update(_companyId: string, id: string, patch: UpdateCatalogAttributeInput) {
    const header: Record<string, unknown> = {};
    if (patch.nameAr !== undefined) header.nameAr = patch.nameAr;
    if (patch.displayType !== undefined) header.displayType = patch.displayType;
    if (patch.createVariant !== undefined) header.createVariant = patch.createVariant;
    if (patch.isActive !== undefined) header.isActive = patch.isActive;

    let dto = await apiRequest<AttributeDto>(`/inventory/catalog-attributes/${id}`);
    if (Object.keys(header).length > 0) {
      dto = await apiRequest<AttributeDto>(`/inventory/catalog-attributes/${id}`, {
        method: 'PATCH',
        body: header,
      });
    }

    const values =
      patch.values !== undefined
        ? await syncValues(id, dto.displayType, patch.values)
        : await fetchValues(id, dto.displayType);

    return {
      id: dto.id,
      companyId: dto.companyId,
      nameAr: dto.nameAr,
      displayType: dto.displayType,
      createVariant: dto.createVariant,
      values,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    } satisfies CatalogAttribute;
  },

  async remove(_companyId: string, id: string) {
    await apiRequest<void>(`/inventory/catalog-attributes/${id}`, { method: 'DELETE' });
    return true;
  },
};
