import { getLocale } from 'next-intl/server';
import type { StorefrontPageView } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { StorefrontPage } from '@/features/ecommerce/storefront/page-builder/components/storefront-page';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { websiteJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

/** Homepage route consumer — delegates rendering to the generic page builder. */
export async function StoreHomePage({ page }: { page: StorefrontPageView }) {
  const locale = (await getLocale()) as StorefrontLocale;
  const config = await getStorefrontCompanyConfig();

  return (
    <>
      <JsonLd data={websiteJsonLd(config, locale)} />
      <StorefrontPage page={page} />
    </>
  );
}
