import { mockProductsStore } from '@/features/ecommerce/shared/lib/adapters/mock-catalog-store';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type { Product, ProductListQuery, CreateProductInput, UpdateProductInput } from '@/features/ecommerce/domain/types/product';
import type { AdminProductsPort } from '@/features/ecommerce/domain/ports/catalog.ports';

function sortComparator(query: ProductListQuery): ((a: Product, b: Product) => number) | undefined {
  if (!query.sort) return undefined;
  const direction = query.sortDirection === 'desc' ? -1 : 1;

  return (a, b) => {
    switch (query.sort) {
      case 'name':
        return a.nameAr.localeCompare(b.nameAr) * direction;
      case 'price':
        return (a.price.amount - b.price.amount) * direction;
      case 'stock':
        return (a.inventory.quantity - b.inventory.quantity) * direction;
      case 'createdAt':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      case 'updatedAt':
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
      default:
        return 0;
    }
  };
}

/**
 * AdminProductsPort — today: shared mock catalog store.
 * Tomorrow: Admin HTTP API. Callers (hooks) stay unchanged.
 */
export const productsApi: AdminProductsPort = {
  getAll(query: ProductListQuery): Promise<PaginatedResult<Product>> {
    return mockProductsStore.list(
      query,
      (item, q) => {
        if (q.categoryId && item.categoryId !== q.categoryId) return false;
        if (q.brandId && item.brandId !== q.brandId) return false;
        if (q.status && item.status !== q.status) return false;
        if (q.stockStatus && item.stockStatus !== q.stockStatus) return false;
        if (q.minPrice !== undefined && item.price.amount < q.minPrice) return false;
        if (q.maxPrice !== undefined && item.price.amount > q.maxPrice) return false;
        if (q.search) {
          const search = q.search.toLowerCase();
          return (
            item.nameAr.toLowerCase().includes(search) ||
            (item.nameEn?.toLowerCase().includes(search) ?? false) ||
            item.sku.toLowerCase().includes(search) ||
            (item.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
          );
        }
        return true;
      },
      sortComparator(query),
    );
  },
  getById(companyId: string, id: string) {
    return mockProductsStore.getById(companyId, id);
  },
  getBySlug(companyId: string, slug: string) {
    return mockProductsStore.getBySlug(companyId, slug);
  },
  create(input: CreateProductInput) {
    const now = new Date().toISOString();
    return mockProductsStore.create({
      ...input,
      id: `prod-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId: string, id: string, patch: UpdateProductInput) {
    return mockProductsStore.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId: string, id: string) {
    return mockProductsStore.remove(companyId, id);
  },
  duplicate(companyId: string, id: string) {
    const now = new Date().toISOString();
    const suffix = Math.random().toString(36).slice(2, 6);
    return mockProductsStore.duplicate(companyId, id, (source) => ({
      id: `prod-${Math.random().toString(36).slice(2, 10)}`,
      sku: `${source.sku}-copy-${suffix}`,
      slug: `${source.slug}-copy-${suffix}`,
      status: 'draft',
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    }));
  },
  archive(companyId: string, id: string) {
    return mockProductsStore.update(companyId, id, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  unarchive(companyId: string, id: string) {
    return mockProductsStore.update(companyId, id, {
      status: 'active',
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    });
  },
  bulkUpdateStatus(companyId: string, ids: string[], status: Product['status']) {
    return mockProductsStore.bulkUpdate(companyId, ids, {
      status,
      archivedAt: status === 'archived' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  },
  bulkRemove(companyId: string, ids: string[]) {
    return mockProductsStore.bulkRemove(companyId, ids);
  },
};
