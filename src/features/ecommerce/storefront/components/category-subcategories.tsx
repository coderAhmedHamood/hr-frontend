'use client';

import { useTranslations } from 'next-intl';
import { CategoryCard } from '@/features/ecommerce/storefront/components/catalog/category-card';
import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';

export function CategorySubcategories({
  subcategories,
}: {
  subcategories: StorefrontCategory[];
}) {
  if (subcategories.length === 0) return null;

  const t = useTranslations('storefront.categories');

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
      <h2 className="text-sm font-semibold text-foreground">{t('subcategories')}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:gap-4">
        {subcategories.map((category) => (
          <CategoryCard key={category.id} category={category} variant="circle" className="w-20 sm:w-24" />
        ))}
      </div>
    </section>
  );
}
