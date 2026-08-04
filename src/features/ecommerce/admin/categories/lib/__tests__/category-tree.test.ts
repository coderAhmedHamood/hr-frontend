import {
  getCategoryDepth,
  getCategoryPath,
  sortCategoriesAsTree,
} from '@/features/ecommerce/admin/categories/lib/category-tree';
import type { Category } from '@/features/ecommerce/domain/types/category';

const sample: Category[] = [
  {
    id: 'r',
    companyId: 'c',
    slug: 'home',
    nameAr: 'المنزل',
    parentId: null,
    seo: {},
    displayOrder: 1,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'a',
    companyId: 'c',
    slug: 'lighting',
    nameAr: 'الإضاءة',
    parentId: 'r',
    seo: {},
    displayOrder: 1,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'b',
    companyId: 'c',
    slug: 'lamps',
    nameAr: 'مصابيح',
    parentId: 'a',
    seo: {},
    displayOrder: 1,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c4',
    companyId: 'c',
    slug: 'led',
    nameAr: 'مصابيح LED',
    parentId: 'b',
    seo: {},
    displayOrder: 1,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

describe('category-tree', () => {
  const byId = new Map(sample.map((item) => [item.id, item]));

  it('computes depth up to 4 levels', () => {
    expect(getCategoryDepth(sample[0]!, byId)).toBe(1);
    expect(getCategoryDepth(sample[3]!, byId)).toBe(4);
  });

  it('builds path label', () => {
    expect(getCategoryPath(sample[3]!, byId).pathLabel).toBe('المنزل › الإضاءة › مصابيح › مصابيح LED');
  });

  it('sorts parents before children', () => {
    const shuffled = [sample[3]!, sample[1]!, sample[0]!, sample[2]!];
    expect(sortCategoriesAsTree(shuffled).map((item) => item.id)).toEqual(['r', 'a', 'b', 'c4']);
  });
});
