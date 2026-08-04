import { mockCategoriesStore } from '@/features/ecommerce/shared/lib/adapters/mock-catalog-store';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  Category,
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/features/ecommerce/domain/types/category';
import type { AdminCategoriesPort } from '@/features/ecommerce/domain/ports/catalog.ports';

/** AdminCategoriesPort — shared mock catalog store today; Admin HTTP tomorrow. */
export const categoriesApi: AdminCategoriesPort = {
  getAll(query: CategoryListQuery): Promise<PaginatedResult<Category>> {
    return mockCategoriesStore.list(query, (item, q) => {
      if (q.parentId !== undefined && item.parentId !== q.parentId) return false;
      if (q.search) return item.nameAr.toLowerCase().includes(q.search.toLowerCase());
      return true;
    });
  },
  getById(companyId: string, id: string) {
    return mockCategoriesStore.getById(companyId, id);
  },
  getBySlug(companyId: string, slug: string) {
    return mockCategoriesStore.getBySlug(companyId, slug);
  },
  create(input: CreateCategoryInput) {
    const now = new Date().toISOString();
    return mockCategoriesStore.create({
      ...input,
      id: `cat-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId: string, id: string, patch: UpdateCategoryInput) {
    return mockCategoriesStore.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId: string, id: string) {
    return mockCategoriesStore.remove(companyId, id);
  },
};
