import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';
import { CategoryCard } from '@/features/ecommerce/storefront/components/catalog/category-card';

export function StoreCategoryCircles({ categories }: { categories: StorefrontCategory[] }) {
  const roots = categories.filter((category) => !category.parentId).sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
      {roots.map((category) => (
        <CategoryCard key={category.id} category={category} variant="circle" />
      ))}
    </div>
  );
}
