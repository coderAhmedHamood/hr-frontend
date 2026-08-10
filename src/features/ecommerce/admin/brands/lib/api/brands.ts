import { mockBrandsStore } from '@/features/ecommerce/shared/lib/adapters/mock-catalog-store';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type { Brand, BrandListQuery, CreateBrandInput, UpdateBrandInput } from '@/features/ecommerce/domain/types/brand';
import type { AdminBrandsPort } from '@/features/ecommerce/domain/ports/catalog.ports';

/** AdminBrandsPort — shared mock catalog store today; Admin HTTP tomorrow. */
export const brandsApi: AdminBrandsPort = {
  getAll(query: BrandListQuery): Promise<PaginatedResult<Brand>> {
    return mockBrandsStore.list(query, (item, q) => {
      if (q.search) {
        const search = q.search.toLowerCase();
        return item.nameAr.toLowerCase().includes(search) || (item.nameEn?.toLowerCase().includes(search) ?? false);
      }
      return true;
    });
  },
  getById(companyId: string, id: string) {
    return mockBrandsStore.getById(companyId, id);
  },
  getBySlug(companyId: string, slug: string) {
    return mockBrandsStore.getBySlug(companyId, slug);
  },
  create(input: CreateBrandInput) {
    const now = new Date().toISOString();
    return mockBrandsStore.create({
      ...input,
      id: `brand-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId: string, id: string, patch: UpdateBrandInput) {
    return mockBrandsStore.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId: string, id: string) {
    return mockBrandsStore.remove(companyId, id);
  },
};
