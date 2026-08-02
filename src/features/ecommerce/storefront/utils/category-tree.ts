import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';

export type MegaMenuColumn = {
  group: StorefrontCategory;
  links: StorefrontCategory[];
};

export function buildCategoryTree(categories: StorefrontCategory[]) {
  const roots = categories
    .filter((category) => !category.parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const childrenByParent = categories.reduce<Record<string, StorefrontCategory[]>>((acc, category) => {
    if (!category.parentId) return acc;
    const siblings = acc[category.parentId] ?? [];
    acc[category.parentId] = [...siblings, category];
    return acc;
  }, {});

  for (const parentId of Object.keys(childrenByParent)) {
    childrenByParent[parentId].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return { roots, childrenByParent };
}

/**
 * Noon-style mega columns for a root category:
 * - L2 with L3 children → column header = L2, links = L3
 * - L2 without children → still a column with a single "view group" link to L2
 */
export function buildMegaMenuColumns(
  rootId: string,
  childrenByParent: Record<string, StorefrontCategory[]>,
): MegaMenuColumn[] {
  const groups = childrenByParent[rootId] ?? [];
  return groups.map((group) => ({
    group,
    links: childrenByParent[group.id] ?? [],
  }));
}
