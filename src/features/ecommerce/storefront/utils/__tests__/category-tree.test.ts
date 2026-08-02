import { buildCategoryTree, buildMegaMenuColumns } from '@/features/ecommerce/storefront/utils/category-tree';
import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';

function cat(
  partial: Pick<StorefrontCategory, 'id' | 'slug' | 'name' | 'parentId' | 'displayOrder'> &
    Partial<StorefrontCategory>,
): StorefrontCategory {
  return {
    companyId: 'demo',
    description: '',
    imageUrl: null,
    imageAlt: '',
    featuredBrandIds: [],
    metaTitle: '',
    metaDescription: '',
    ...partial,
  };
}

describe('buildMegaMenuColumns', () => {
  const categories = [
    cat({ id: 'root', slug: 'grocery', name: 'البقالة', parentId: null, displayOrder: 1, featuredBrandIds: ['b1'] }),
    cat({ id: 'l2a', slug: 'breakfast', name: 'إفطار', parentId: 'root', displayOrder: 1 }),
    cat({ id: 'l3a', slug: 'cereal', name: 'حبوب', parentId: 'l2a', displayOrder: 1 }),
    cat({ id: 'l3b', slug: 'jam', name: 'مربى', parentId: 'l2a', displayOrder: 2 }),
    cat({ id: 'l2b', slug: 'spices', name: 'بهارات', parentId: 'root', displayOrder: 2 }),
  ];

  it('builds Noon-style L2 columns with L3 links for the active root', () => {
    const { childrenByParent } = buildCategoryTree(categories);
    const columns = buildMegaMenuColumns('root', childrenByParent);

    expect(columns).toHaveLength(2);
    expect(columns[0].group.slug).toBe('breakfast');
    expect(columns[0].links.map((link) => link.slug)).toEqual(['cereal', 'jam']);
    expect(columns[1].group.slug).toBe('spices');
    expect(columns[1].links).toHaveLength(0);
  });

  it('refills columns per root (empty when another root has no children)', () => {
    const withOtherRoot = [
      ...categories,
      cat({ id: 'other', slug: 'cleaning', name: 'التنظيف', parentId: null, displayOrder: 2 }),
    ];
    const { childrenByParent } = buildCategoryTree(withOtherRoot);

    expect(buildMegaMenuColumns('root', childrenByParent)).toHaveLength(2);
    expect(buildMegaMenuColumns('other', childrenByParent)).toHaveLength(0);
  });
});
