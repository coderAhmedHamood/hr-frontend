import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import {
  normalizeAttributeValue,
  type CatalogAttribute,
  type CatalogAttributeListQuery,
  type CreateCatalogAttributeInput,
  type UpdateCatalogAttributeInput,
} from '@/features/ecommerce/domain/types/catalog-attribute';
import attributesSeed from '@/features/ecommerce/shared/lib/mock/catalog-attributes.json';

const repository = createMockRepository<CatalogAttribute>(attributesSeed as CatalogAttribute[]);

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAttribute(attribute: CatalogAttribute): CatalogAttribute {
  return {
    ...attribute,
    values: attribute.values.map((value) => normalizeAttributeValue(value, attribute.displayType)),
  };
}

export const catalogAttributesApi = {
  async getAll(query: CatalogAttributeListQuery) {
    const result = await repository.list(
      query,
      (item, q) => {
        if (!q.search) return true;
        const search = q.search.toLowerCase();
        return item.nameAr.toLowerCase().includes(search);
      },
      (a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'),
    );
    return {
      ...result,
      items: result.items.map(normalizeAttribute),
    };
  },
  async getById(companyId: string, id: string) {
    const item = await repository.getById(companyId, id);
    return item ? normalizeAttribute(item) : null;
  },
  create(input: CreateCatalogAttributeInput) {
    const now = new Date().toISOString();
    return repository.create({
      ...input,
      values: input.values.map((value) => normalizeAttributeValue(value, input.displayType)),
      id: newId('attr'),
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId: string, id: string, patch: UpdateCatalogAttributeInput) {
    const nextValues = patch.values
      ? patch.values.map((value) =>
          normalizeAttributeValue(value, patch.displayType),
        )
      : undefined;
    return repository.update(companyId, id, {
      ...patch,
      ...(nextValues ? { values: nextValues } : {}),
      updatedAt: new Date().toISOString(),
    });
  },
  remove(companyId: string, id: string) {
    return repository.remove(companyId, id);
  },
};
