'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { StorefrontShellChrome } from '@/features/ecommerce/storefront/components/storefront-shell-chrome';
import { StoreCsrError, StoreCsrLoading } from '@/features/ecommerce/storefront/components/store-csr-status';
import { clientStorefrontData } from '@/features/ecommerce/storefront/lib/client-storefront-data';
import { organizationJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';

export function StorefrontShellCsr({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as StorefrontLocale;
  const [config, setConfig] = React.useState<StorefrontCompanyConfig | null>(null);
  const [categories, setCategories] = React.useState<StorefrontCategory[]>([]);
  const [brands, setBrands] = React.useState<StorefrontBrand[]>([]);
  const [orgLd, setOrgLd] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [nextConfig, nextCategories, brandsPage] = await Promise.all([
          clientStorefrontData.getConfig(locale),
          clientStorefrontData.getNavCategories(locale),
          clientStorefrontData.getBrands(locale, { limit: 12 }),
        ]);
        if (cancelled) return;
        if (!nextConfig) {
          setError('Store config not found');
          setLoading(false);
          return;
        }
        setConfig(nextConfig);
        setCategories(nextCategories);
        setBrands(brandsPage.items);
        setOrgLd(await organizationJsonLd(nextConfig, locale));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load store shell');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) return <StoreCsrLoading />;
  if (error || !config) return <StoreCsrError message={error ?? undefined} />;

  return (
    <StorefrontShellChrome
      config={config}
      categories={categories}
      brands={brands}
      locale={locale}
      organizationJsonLd={orgLd}
    >
      {children}
    </StorefrontShellChrome>
  );
}
