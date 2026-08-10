import { getLocale, getTranslations } from 'next-intl/server';
import { LayoutGrid } from 'lucide-react';
import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import { Link } from '@/i18n/navigation';
import type { StorefrontLocale } from '@/i18n/routing';

export async function CategoriesListPage({ categories }: { categories: StorefrontCategory[] }) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(t('categories.title'), '/store/categories', locale)} />
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('categories.title'), path: '/store/categories' },
        ]}
      />
      <h1 className="font-arabic-display text-2xl font-bold text-foreground">{t('categories.title')}</h1>

      {categories.length === 0 ? (
        <StoreEmptyState icon={LayoutGrid} title={t('home.noCategories')} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/store/categories/${category.slug}`}
              className="rounded-xl border border-border bg-card p-6 text-center shadow-soft transition-shadow hover:shadow-elevated"
            >
              <h2 className="text-sm font-semibold text-foreground">{category.name}</h2>
              {category.description ? (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
