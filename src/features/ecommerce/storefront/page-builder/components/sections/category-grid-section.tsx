import type { ResolvedCategoryGridSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { SectionHeader } from '@/features/ecommerce/storefront/components/catalog/section-header';
import { CategoryGridInteractive } from '@/features/ecommerce/storefront/page-builder/components/sections/category-grid-interactive';

function resolveCategoryVariant(layout: ResolvedCategoryGridSection['style']['layout']) {
  if (layout === 'cards') return 'card' as const;
  if (layout === 'list') return 'list' as const;
  return 'circle' as const;
}

export function CategoryGridSection({ section }: { section: ResolvedCategoryGridSection }) {
  const categories = section.data.categories;
  if (categories.length === 0) return null;

  const hasRoots = categories.some((category) => !category.parentId);
  if (!hasRoots) return null;

  const variant = resolveCategoryVariant(section.style.layout);
  const showLabels = section.settings.showLabels;

  return (
    <section className="flex flex-col gap-4">
      {section.heading.title ? (
        <SectionHeader title={section.heading.title} subtitle={section.heading.subtitle || undefined} />
      ) : null}

      <CategoryGridInteractive categories={categories} variant={variant} showLabels={showLabels} />
    </section>
  );
}
