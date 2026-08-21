'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PackageSearch } from 'lucide-react';
import type { StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { InfiniteProductList } from '@/features/ecommerce/storefront/components/catalog/infinite-product-list';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import { clientStorefrontData } from '@/features/ecommerce/storefront/lib/client-storefront-data';
import {
  resolveStoreProductsListQuery,
  type ParsedStoreProductFlags,
} from '@/features/ecommerce/storefront/lib/store-product-list-query';
import type { StorefrontLocale } from '@/i18n/routing';

const PAGE_SIZE = 15;

type CatalogTagPageProps = {
  title: string;
  description: string;
  basePath: `/store/${string}`;
  productsResult: StorefrontPaginated<StorefrontProduct>;
  flags?: ParsedStoreProductFlags;
  sort?: string;
};

export function CatalogTagPage({
  title,
  description,
  basePath,
  productsResult,
  flags = {},
  sort,
}: CatalogTagPageProps) {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;

  const queryKey = React.useMemo(
    () => JSON.stringify({ basePath, flags, sort }),
    [basePath, flags, sort],
  );

  const fetchPage = React.useCallback(
    (page: number) =>
      clientStorefrontData.getProducts(
        locale,
        resolveStoreProductsListQuery({
          page,
          limit: PAGE_SIZE,
          flags,
          sort,
        }),
      ),
    [locale, flags, sort],
  );

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(title, basePath, locale)} />

      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: title, path: basePath },
        ]}
      />

      <div>
        <h1 className="font-arabic-display text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

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
  );
}
