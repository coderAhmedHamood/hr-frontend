import { getLocale, getTranslations } from 'next-intl/server';
import { Toaster } from 'sonner';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { StoreChromeGate, isCheckoutPath } from '@/features/ecommerce/storefront/components/store-chrome-gate';
import { StoreFooter } from '@/features/ecommerce/storefront/components/store-footer';
import { StoreHeader } from '@/features/ecommerce/storefront/components/store-header';
import { StoreMobileTabBar } from '@/features/ecommerce/storefront/components/store-mobile-tab-bar';
import { getStorefrontBrandsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontNavCategories } from '@/features/ecommerce/storefront/lib/loaders/storefront-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { organizationJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import {
  CUSTOM_BODY_FONT_FAMILY,
  CUSTOM_DISPLAY_FONT_FAMILY,
  CUSTOM_STOREFRONT_FONT_ID,
  buildCustomFontFaceCss,
  buildGoogleFontsStylesheetUrl,
  resolveStorefrontFontId,
  storefrontFontFamilyCss,
  DEFAULT_STOREFRONT_BODY_FONT,
  DEFAULT_STOREFRONT_DISPLAY_FONT,
} from '@/features/ecommerce/storefront/lib/storefront-fonts';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
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

  const bodyFontId = resolveStorefrontFontId(
    config.typography?.bodyFontId,
    DEFAULT_STOREFRONT_BODY_FONT,
  );
  const displayFontId = resolveStorefrontFontId(
    config.typography?.displayFontId,
    DEFAULT_STOREFRONT_DISPLAY_FONT,
  );
  const bodyFontUrl = resolveUploadUrl(config.typography?.bodyFontUrl);
  const displayFontUrl = resolveUploadUrl(config.typography?.displayFontUrl);
  const fontsHref = buildGoogleFontsStylesheetUrl([bodyFontId, displayFontId]);
  const customFontCss = [
    bodyFontId === CUSTOM_STOREFRONT_FONT_ID && bodyFontUrl
      ? buildCustomFontFaceCss(CUSTOM_BODY_FONT_FAMILY, bodyFontUrl)
      : '',
    displayFontId === CUSTOM_STOREFRONT_FONT_ID && displayFontUrl
      ? buildCustomFontFaceCss(CUSTOM_DISPLAY_FONT_FAMILY, displayFontUrl)
      : '',
  ]
    .filter(Boolean)
    .join('');

  const themeStyle = {
    ...(config.themeCssVars ?? {
      '--primary': config.theme.primary,
      '--secondary': config.theme.secondary,
      '--accent': config.theme.accent,
    }),
    '--font-body': storefrontFontFamilyCss(bodyFontId, 'body'),
    '--font-display': storefrontFontFamilyCss(displayFontId, 'display'),
  } as CSSProperties;

  return (
    <div
      className="flex min-h-dvh flex-col overflow-x-clip bg-background p-0 font-sans"
      style={themeStyle}
      dir={dir}
      lang={storefrontLocale}
    >
      {/* Dynamic store fonts — only selected Google/custom fonts load here */}
      {fontsHref ? (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fontsHref} />
        </>
      ) : null}
      {customFontCss ? <style dangerouslySetInnerHTML={{ __html: customFontCss }} /> : null}
      <JsonLd data={await organizationJsonLd(config, storefrontLocale)} />
      <Toaster
        className="storefront-toaster"
        theme="system"
        position={dir === 'rtl' ? 'top-right' : 'top-left'}
        dir={dir}
        offset={16}
        gap={8}
        visibleToasts={3}
        style={{ ['--width' as string]: '20rem' }}
        toastOptions={{
          classNames: {
            toast:
              'group toast !min-w-[min(16rem,calc(100vw-2rem))] !max-w-[min(22rem,calc(100vw-2rem))] !w-auto !border-border !bg-card !text-foreground !shadow-soft !rounded-xl !px-3.5 !py-2.5 !gap-2 !text-sm',
            title: '!text-sm !font-medium !text-foreground !whitespace-normal !break-normal',
            description: '!text-xs !text-muted-foreground !whitespace-normal',
            actionButton: '!bg-primary !text-primary-foreground',
            cancelButton: '!bg-muted !text-muted-foreground',
            closeButton: '!border-border !bg-card !text-muted-foreground',
            success: '!border-border !bg-card !text-foreground',
            error: '!border-destructive/30 !bg-card !text-foreground',
          },
        }}
      />
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
      <StoreChromeGate match={isCheckoutPath}>
        <div className="store-footer-safe-pb">
          <StoreFooter config={config} />
        </div>
      </StoreChromeGate>
      <StoreMobileTabBar />
    </div>
  );
}
