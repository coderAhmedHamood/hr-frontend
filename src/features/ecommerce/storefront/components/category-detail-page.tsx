'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PackageSearch } from 'lucide-react';
import type { StorefrontCategory, StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { InfiniteProductList } from '@/features/ecommerce/storefront/components/catalog/infinite-product-list';
import { CategorySubcategories } from '@/features/ecommerce/storefront/components/category-subcategories';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import { clientStorefrontData } from '@/features/ecommerce/storefront/lib/client-storefront-data';
import type { StorefrontLocale } from '@/i18n/routing';

const PAGE_SIZE = 12;

export function CategoryDetailPage({
  category,
  productsResult,
  subcategories = [],
}: {
  category: StorefrontCategory;
  productsResult: StorefrontPaginated<StorefrontProduct>;
  subcategories?: StorefrontCategory[];
}) {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;

  const queryKey = React.useMemo(() => category.id, [category.id]);

  const fetchPage = React.useCallback(
    (page: number) =>
      clientStorefrontData.getProducts(locale, {
        categoryId: category.id,
        page,
        limit: PAGE_SIZE,
      }),
    [locale, category.id],
  );

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('nav.categories'), path: '/store/categories' as const },
    { name: category.name, path: `/store/categories/${category.slug}` as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(category.name, `/store/categories/${category.slug}`, locale)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />

      <StoreBreadcrumbs items={breadcrumbItems} />

      <div>
        <h1 className="font-arabic-display text-2xl font-bold text-foreground">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
        ) : null}
      </div>

      <CategorySubcategories subcategories={subcategories} />

      {productsResult.items.length === 0 ? (
        <StoreEmptyState icon={PackageSearch} title={t('categories.noResults')} />
      ) : (
        <InfiniteProductList
          queryKey={queryKey}
          initialItems={productsResult.items}
          totalPages={productsResult.pagination.totalPages}
          fetchPage={fetchPage}
        />
      )}
    </div>
  );
}
