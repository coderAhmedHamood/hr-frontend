'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PackageSearch } from 'lucide-react';
import type {
  StorefrontCategory,
  StorefrontCompanyConfig,
  StorefrontPaginated,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { InfiniteProductList } from '@/features/ecommerce/storefront/components/catalog/infinite-product-list';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { StorePlpSidebar } from '@/features/ecommerce/storefront/components/store-plp-sidebar';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import { clientStorefrontData } from '@/features/ecommerce/storefront/lib/client-storefront-data';
import {
  resolveStoreProductsListQuery,
  type ParsedStoreProductFlags,
} from '@/features/ecommerce/storefront/lib/store-product-list-query';
import type { StorefrontLocale } from '@/i18n/routing';

const PAGE_SIZE = 15;

function productsHeading(
  t: ReturnType<typeof useTranslations<'storefront'>>,
  flags: ParsedStoreProductFlags,
): string {
  if (flags.isNewProduct) return t('home.latestProducts');
  if (flags.isTodayDeal) return t('home.dealsToday');
  if (flags.isWholesale) return t('wholesale.title');
  if (flags.isDiscounted) return t('discounts.title');
  return t('products.title');
}

export function ProductsBrowsePage({
  categorySlug,
  tag,
  sort,
  flags = {},
  categories,
  secondaryNavigation,
  storePages,
  productsResult,
}: {
  categorySlug?: string;
  tag?: string;
  sort?: string;
  flags?: ParsedStoreProductFlags;
  categories: StorefrontCategory[];
  secondaryNavigation?: StorefrontCompanyConfig['secondaryNavigation'];
  storePages?: StorefrontCompanyConfig['storePages'];
  productsResult: StorefrontPaginated<StorefrontProduct>;
}) {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;
  const title = productsHeading(t, flags);
  const activeCategory = categorySlug ? categories.find((item) => item.slug === categorySlug) : undefined;

  const queryKey = React.useMemo(
    () => JSON.stringify({ categorySlug, tag, sort, flags }),
    [categorySlug, tag, sort, flags],
  );

  const fetchPage = React.useCallback(
    (page: number) =>
      clientStorefrontData.getProducts(
        locale,
        resolveStoreProductsListQuery({
          page,
          limit: PAGE_SIZE,
          categoryId: activeCategory?.id,
          tag,
          sort,
          flags,
        }),
      ),
    [locale, activeCategory?.id, tag, sort, flags],
  );

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(title, '/store/products', locale)} />

      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: title, path: '/store/products' },
        ]}
      />

      <h1 className="font-arabic-display text-xl font-bold text-foreground sm:text-2xl">{title}</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <StorePlpSidebar
          categories={categories}
          secondaryNavigation={secondaryNavigation}
          storePages={storePages}
          activeCategorySlug={categorySlug}
          activeTag={tag}
        />

        <div className="min-w-0 flex-1">
          {productsResult.items.length === 0 ? (
            <StoreEmptyState icon={PackageSearch} title={t('products.noResults')} />
          ) : (
            <InfiniteProductList
              queryKey={queryKey}
              initialItems={productsResult.items}
              totalPages={productsResult.pagination.totalPages}
              fetchPage={fetchPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
