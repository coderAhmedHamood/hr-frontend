import { getLocale, getTranslations } from 'next-intl/server';
import type { StorefrontAboutContent } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

export async function AboutPage({ content }: { content: StorefrontAboutContent }) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('about.title'), path: '/store/about' as const },
  ];

  return (
    <div className="flex flex-col gap-10 pb-4">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      <StoreBreadcrumbs items={breadcrumbItems} />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-bl from-primary/10 via-card to-card px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -start-16 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold tracking-wide text-primary">{t('about.title')}</p>
          <h1 className="mt-3 font-arabic-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {content.headline}
          </h1>
          {content.intro ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {content.intro}
            </p>
          ) : null}
        </div>
      </section>

      {content.stats.length > 0 ? (
        <section aria-label={t('about.title')} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {content.stats.map((stat) => (
            <div
              key={stat.id}
              className="rounded-2xl border border-border/70 bg-card px-4 py-5 text-center sm:px-5"
            >
              <p className="font-arabic-display text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </section>
      ) : null}

      {content.sections.length > 0 ? (
        <section className="space-y-4">
          <div className="max-w-2xl">
            <h2 className="font-arabic-display text-xl font-semibold text-foreground sm:text-2xl">
              {t('about.storyTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('about.storyHint')}</p>
          </div>
          <ol className="grid gap-4 lg:grid-cols-3">
            {content.sections.map((section, index) => (
              <li
                key={section.id}
                className="relative flex flex-col rounded-2xl border border-border/70 bg-card p-6 transition-colors hover:border-primary/30"
              >
                <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold tabular-nums text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-base font-semibold leading-snug text-foreground">{section.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
