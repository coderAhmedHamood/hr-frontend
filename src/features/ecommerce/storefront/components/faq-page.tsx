import { getLocale, getTranslations } from 'next-intl/server';
import { ChevronDown, HelpCircle } from 'lucide-react';
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
    <div className="flex flex-col gap-10 pb-4">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      {items.length > 0 ? <JsonLd data={faqJsonLd(items, locale)} /> : null}

      <StoreBreadcrumbs items={breadcrumbItems} />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-bl from-primary/10 via-card to-card px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -start-8 bottom-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-primary">{t('faq.title')}</p>
          <h1 className="mt-3 font-arabic-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {t('faq.title')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t('faq.subtitle')}</p>
        </div>
      </section>

      {items.length === 0 ? (
        <StoreEmptyState icon={HelpCircle} title={t('faq.empty')} />
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {items.map((item, index) => (
            <details
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card open:border-primary/25 open:shadow-soft"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [&::-webkit-details-marker]:hidden">
                <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums text-muted-foreground group-open:bg-primary/10 group-open:text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary"
                  aria-hidden
                />
              </summary>
              <div className="border-t border-border/60 px-5 py-4 ps-13 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
