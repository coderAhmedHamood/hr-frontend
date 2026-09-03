'use client';

import { useTranslations } from 'next-intl';
import type { StorefrontLegalPage } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import { RichTextHtml } from '@/components/ui/rich-text-html';
import { formatDisplayDate } from '@/shared/utils';
import type { StorefrontLocale } from '@/i18n/routing';

export function LegalPage({
  page,
  locale,
}: {
  page: StorefrontLegalPage;
  locale: StorefrontLocale;
}) {
  const t = useTranslations('storefront');
  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: page.title, path: `/store/legal/${page.slug}` as const },
  ];

  return (
    <div className="flex flex-col gap-8 pb-4">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      <StoreBreadcrumbs items={breadcrumbItems} />

      <article className="mx-auto w-full max-w-3xl">
        <header className="rounded-3xl border border-border/70 bg-linear-to-bl from-primary/8 via-card to-card px-6 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-semibold tracking-wide text-primary">{t(`legal.${page.slug}`)}</p>
          <h1 className="mt-3 font-arabic-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {page.title}
          </h1>
          <p className="mt-4 inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            {t('legal.lastUpdated')}:{' '}
            <span className="ms-1 font-medium text-foreground">
              {formatDisplayDate(page.updatedAt)}
            </span>
          </p>
        </header>

        <RichTextHtml html={page.body} className="mt-6 max-w-3xl" />
      </article>
    </div>
  );
}
