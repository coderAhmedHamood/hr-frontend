'use client';

import { useLocale } from 'next-intl';
import type { StorefrontPageView } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { StorefrontPage } from '@/features/ecommerce/storefront/page-builder/components/storefront-page';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { websiteJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';

export function StoreHomePageView({
  page,
  config,
}: {
  page: StorefrontPageView;
  config: StorefrontCompanyConfig;
}) {
  const locale = useLocale() as StorefrontLocale;

  return (
    <>
      <JsonLd data={websiteJsonLd(config, locale)} />
      <StorefrontPage page={page} />
    </>
  );
}
