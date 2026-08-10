'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft } from 'lucide-react';
import { CategoryCard } from '@/features/ecommerce/storefront/components/catalog/category-card';
import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';
import { buildCategoryTree } from '@/features/ecommerce/storefront/utils/category-tree';

type CategoryGridInteractiveProps = {
  categories: StorefrontCategory[];
  variant: 'circle' | 'card' | 'list';
  showLabels: boolean;
};

type LevelPanelProps = {
  title: string;
  eyebrow: string;
  parent: StorefrontCategory;
  items: StorefrontCategory[];
  childrenByParent: Record<string, StorefrontCategory[]>;
  selectedId: string | null;
  /** When set, items that have children expand instead of navigating. */
  onSelectParentWithChildren?: (category: StorefrontCategory) => void;
  variant: 'circle' | 'card' | 'list';
  showLabels: boolean;
  viewAllLabel: string;
};

function CategoryLevelPanel({
  title,
  eyebrow,
  parent,
  items,
  childrenByParent,
  selectedId,
  onSelectParentWithChildren,
  variant,
  showLabels,
  viewAllLabel,
}: LevelPanelProps) {
  const cardVariant = variant === 'list' ? 'list' : 'circle';

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <Link
          href={`/store/categories/${parent.slug}`}
          prefetch={false}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {viewAllLabel}
          <ChevronLeft className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:gap-4">
        {items.map((category) => {
          const hasChildren = (childrenByParent[category.id]?.length ?? 0) > 0;
          const canExpand = Boolean(onSelectParentWithChildren) && hasChildren;
          return (
            <CategoryCard
              key={category.id}
              category={category}
              variant={cardVariant}
              showLabel={showLabels}
              selected={category.id === selectedId}
              onActivate={canExpand ? () => onSelectParentWithChildren?.(category) : undefined}
              className={cardVariant === 'list' ? undefined : 'w-20 sm:w-24'}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CategoryGridInteractive({
  categories,
  variant,
  showLabels,
}: CategoryGridInteractiveProps) {
  const t = useTranslations('storefront.categories');
  const { roots, childrenByParent } = useMemo(() => buildCategoryTree(categories), [categories]);

  /** Expansion path: L1 → L2 panel, then optional L2 → L3 panel. Both stay closed until tapped. */
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const selectedRoot = roots.find((root) => root.id === selectedRootId) ?? null;
  const subcategories = selectedRoot ? (childrenByParent[selectedRoot.id] ?? []) : [];

  const selectedSubcategory =
    subcategories.find((category) => category.id === selectedSubcategoryId) ?? null;
  const nestedSubcategories = selectedSubcategory
    ? (childrenByParent[selectedSubcategory.id] ?? [])
    : [];

  function handleRootActivate(root: StorefrontCategory) {
    const children = childrenByParent[root.id] ?? [];
    if (children.length === 0) return;
    setSelectedRootId((current) => {
      if (current === root.id) {
        setSelectedSubcategoryId(null);
        return null;
      }
      setSelectedSubcategoryId(null);
      return root.id;
    });
  }

  function handleSubcategoryActivate(subcategory: StorefrontCategory) {
    const children = childrenByParent[subcategory.id] ?? [];
    if (children.length === 0) return;
    setSelectedSubcategoryId((current) => (current === subcategory.id ? null : subcategory.id));
  }

  if (roots.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {variant === 'circle' ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {roots.map((category) => {
            const hasChildren = (childrenByParent[category.id]?.length ?? 0) > 0;
            return (
              <CategoryCard
                key={category.id}
                category={category}
                variant="circle"
                showLabel={showLabels}
                selected={category.id === selectedRootId}
                onActivate={hasChildren ? () => handleRootActivate(category) : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div
          className={
            variant === 'list'
              ? 'flex flex-col gap-2'
              : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
          }
        >
          {roots.map((category) => {
            const hasChildren = (childrenByParent[category.id]?.length ?? 0) > 0;
            return (
              <CategoryCard
                key={category.id}
                category={category}
                variant={variant}
                showLabel={showLabels}
                selected={category.id === selectedRootId}
                onActivate={hasChildren ? () => handleRootActivate(category) : undefined}
              />
            );
          })}
        </div>
      )}

      {selectedRoot && subcategories.length > 0 ? (
        <CategoryLevelPanel
          eyebrow={t('subcategories')}
          title={selectedRoot.name}
          parent={selectedRoot}
          items={subcategories}
          childrenByParent={childrenByParent}
          selectedId={selectedSubcategoryId}
          onSelectParentWithChildren={handleSubcategoryActivate}
          variant={variant}
          showLabels={showLabels}
          viewAllLabel={t('viewAllInCategory')}
        />
      ) : null}

      {selectedSubcategory && nestedSubcategories.length > 0 ? (
        <CategoryLevelPanel
          eyebrow={t('nestedSubcategories')}
          title={selectedSubcategory.name}
          parent={selectedSubcategory}
          items={nestedSubcategories}
          childrenByParent={childrenByParent}
          selectedId={null}
          variant={variant}
          showLabels={showLabels}
          viewAllLabel={t('viewAllInCategory')}
        />
      ) : null}
    </div>
  );
}
