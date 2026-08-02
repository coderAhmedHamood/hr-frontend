import { getFormatter, getTranslations } from 'next-intl/server';
import type { StorefrontLegalPage } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

export async function LegalPage({
  page,
  locale,
}: {
  page: StorefrontLegalPage;
  locale: StorefrontLocale;
}) {
  const t = await getTranslations('storefront');
  const format = await getFormatter();

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: page.title, path: `/store/legal/${page.slug}` as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      <StoreBreadcrumbs items={breadcrumbItems} />

      <header>
        <h1 className="font-arabic-display text-2xl font-bold text-foreground">{page.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('legal.lastUpdated')}: {format.dateTime(new Date(page.updatedAt), { dateStyle: 'medium' })}
        </p>
      </header>

      <div className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{page.body}</div>
    </div>
  );
}
