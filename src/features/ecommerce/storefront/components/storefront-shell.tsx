import { getLocale, getTranslations } from 'next-intl/server';
import { Toaster } from 'sonner';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { StoreFooter } from '@/features/ecommerce/storefront/components/store-footer';
import { StoreHeader } from '@/features/ecommerce/storefront/components/store-header';
import { StoreMobileTabBar } from '@/features/ecommerce/storefront/components/store-mobile-tab-bar';
import { getStorefrontBrandsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontNavCategories } from '@/features/ecommerce/storefront/lib/loaders/storefront-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { organizationJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import { isRtlLocale, type StorefrontLocale } from '@/i18n/routing';
import type { CSSProperties } from 'react';

export async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [config, categories, brandsPage, t, locale] = await Promise.all([
    getStorefrontCompanyConfig(),
    getStorefrontNavCategories(),
    getStorefrontBrandsList({ limit: 12 }),
    getTranslations('storefront'),
    getLocale(),
  ]);
  const brands = brandsPage.items;
  const storefrontLocale = locale as StorefrontLocale;
  const dir = isRtlLocale(storefrontLocale) ? 'rtl' : 'ltr';

  const themeStyle = {
    '--primary': config.theme.primary,
    '--secondary': config.theme.secondary,
    '--accent': config.theme.accent,
  } as CSSProperties;

  return (
    <div
      className="flex min-h-dvh flex-col overflow-x-clip bg-background p-0"
      style={themeStyle}
      dir={dir}
      lang={storefrontLocale}
    >
      <JsonLd data={await organizationJsonLd(config, storefrontLocale)} />
      <Toaster richColors position="top-center" dir={dir} closeButton />
      <a
        href="#store-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t('a11y.skipToContent')}
      </a>
      <StoreHeader config={config} categories={categories} brands={brands} />
      <main
        id="store-main"
        className="store-main-safe-pb mx-auto w-full max-w-[1400px] flex-1 overflow-x-clip px-4 py-4 sm:px-6 sm:py-6"
      >
        {children}
      </main>
      <div className="store-footer-safe-pb">
        <StoreFooter config={config} categories={categories} />
      </div>
      <StoreMobileTabBar />
    </div>
  );
}
