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
    <div className="flex flex-col gap-8">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      <StoreBreadcrumbs items={breadcrumbItems} />

      <header className="max-w-3xl">
        <h1 className="font-arabic-display text-3xl font-bold text-foreground">{content.headline}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{content.intro}</p>
      </header>

      {content.stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {content.stats.map((stat) => (
            <div key={stat.id} className="rounded-xl border border-border bg-card p-5 text-center shadow-soft">
              <p className="font-arabic-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {content.sections.map((section) => (
          <article key={section.id} className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
