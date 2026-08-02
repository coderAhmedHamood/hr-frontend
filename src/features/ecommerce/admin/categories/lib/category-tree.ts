import type { Category } from '@/features/ecommerce/domain/types/category';

export type CategoryTreeMeta = {
  depth: number;
  pathIds: string[];
  pathNamesAr: string[];
  pathLabel: string;
};

/** Depth starts at 1 for root categories. Not a system max — sample trees may go to 4+. */
export function getCategoryDepth(category: Category, byId: Map<string, Category>): number {
  let depth = 1;
  let current: Category | undefined = category;
  const seen = new Set<string>();
  while (current?.parentId) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    current = byId.get(current.parentId);
    if (!current) break;
    depth += 1;
  }
  return depth;
}

export function getCategoryPath(category: Category, byId: Map<string, Category>): CategoryTreeMeta {
  const chain: Category[] = [category];
  const seen = new Set<string>([category.id]);
  let current: Category | undefined = category;
  while (current?.parentId) {
    if (seen.has(current.parentId)) break;
    const parent = byId.get(current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    seen.add(parent.id);
    current = parent;
  }
  const pathNamesAr = chain.map((item) => item.nameAr);
  return {
    depth: chain.length,
    pathIds: chain.map((item) => item.id),
    pathNamesAr,
    pathLabel: pathNamesAr.join(' › '),
  };
}

/** Depth-first order so parents appear above children (tree reading order). */
export function sortCategoriesAsTree(categories: Category[]): Category[] {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const children = new Map<string | null, Category[]>();

  for (const category of categories) {
    const key = category.parentId ?? null;
    const list = children.get(key) ?? [];
    list.push(category);
    children.set(key, list);
  }

  for (const list of children.values()) {
    list.sort((a, b) => a.displayOrder - b.displayOrder || a.nameAr.localeCompare(b.nameAr, 'ar'));
  }

  const ordered: Category[] = [];
  function walk(parentId: string | null) {
    for (const child of children.get(parentId) ?? []) {
      if (!byId.has(child.id)) continue;
      ordered.push(child);
      walk(child.id);
    }
  }
  walk(null);

  // Orphans (parent missing from current set) appended at end.
  for (const category of categories) {
    if (!ordered.includes(category)) ordered.push(category);
  }
  return ordered;
}

export function categoryFilterLabel(category: Category, byId: Map<string, Category>): string {
  const { depth, pathLabel } = getCategoryPath(category, byId);
  const indent = depth > 1 ? `${'—'.repeat(depth - 1)} ` : '';
  return depth > 1 ? `${indent}${category.nameAr}` : category.nameAr;
}

export { getCategoryPath as buildCategoryPath };
