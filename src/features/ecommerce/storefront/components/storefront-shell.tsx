import { getLocale } from 'next-intl/server';
import { StorefrontShellChrome } from '@/features/ecommerce/storefront/components/storefront-shell-chrome';
import { getStorefrontBrandsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontNavCategories } from '@/features/ecommerce/storefront/lib/loaders/storefront-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { organizationJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import type { StorefrontLocale } from '@/i18n/routing';

export async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [config, categories, brandsPage, locale] = await Promise.all([
    getStorefrontCompanyConfig(),
    getStorefrontNavCategories(),
    getStorefrontBrandsList({ limit: 12 }),
    getLocale(),
  ]);
  const storefrontLocale = locale as StorefrontLocale;

  return (
    <StorefrontShellChrome
      config={config}
      categories={categories}
      brands={brandsPage.items}
      locale={storefrontLocale}
      organizationJsonLd={organizationJsonLd(config, storefrontLocale)}
    >
      {children}
    </StorefrontShellChrome>
  );
}
