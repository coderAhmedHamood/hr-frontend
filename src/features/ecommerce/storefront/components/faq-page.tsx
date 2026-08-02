import { getLocale, getTranslations } from 'next-intl/server';
import { HelpCircle } from 'lucide-react';
import type { StorefrontFaqItem } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd, faqJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

export async function FaqPage({ items }: { items: StorefrontFaqItem[] }) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('faq.title'), path: '/store/faq' as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      {items.length > 0 ? <JsonLd data={faqJsonLd(items, locale)} /> : null}

      <StoreBreadcrumbs items={breadcrumbItems} />
      <h1 className="font-arabic-display text-2xl font-bold text-foreground">{t('faq.title')}</h1>

      {items.length === 0 ? (
        <StoreEmptyState icon={HelpCircle} title={t('faq.empty')} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <details
              key={item.id}
              className="group rounded-xl border border-border bg-card shadow-soft open:shadow-elevated"
            >
              <summary className="cursor-pointer list-none rounded-xl px-5 py-4 text-sm font-medium text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [&::-webkit-details-marker]:hidden">
                {item.question}
              </summary>
              <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
