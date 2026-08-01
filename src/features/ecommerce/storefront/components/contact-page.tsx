import { getLocale, getTranslations } from 'next-intl/server';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import type {
  StorefrontCompanyConfig,
  StorefrontContactContent,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { ContactForm } from '@/features/ecommerce/storefront/components/contact-form';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

export async function ContactPage({
  content,
  config,
}: {
  content: StorefrontContactContent;
  config: StorefrontCompanyConfig;
}) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('contact.title'), path: '/store/contact' as const },
  ];

  const hasContactDetails = Boolean(
    config.contact.phone || config.contact.email || config.contact.address || content.hours,
  );

  return (
    <div className="flex flex-col gap-10 pb-4">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      <StoreBreadcrumbs items={breadcrumbItems} />

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-bl from-primary/10 via-card to-card px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -end-10 bottom-0 h-40 w-40 rounded-full bg-secondary/15 blur-3xl" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-primary">{t('contact.title')}</p>
          <h1 className="mt-3 font-arabic-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {content.headline}
          </h1>
          {content.intro ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{content.intro}</p>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <aside className="space-y-4">
          {hasContactDetails ? (
            <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-foreground">{config.name}</h2>
              <ul className="mt-5 space-y-4">
                {config.contact.phone ? (
                  <li>
                    <a
                      href={`tel:${config.contact.phone}`}
                      className="group flex items-start gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Phone className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 pt-2">
                        <span className="block text-xs font-medium text-foreground">{t('contact.phone')}</span>
                        <span className="mt-0.5 block tabular-nums" dir="ltr">
                          {config.contact.phone}
                        </span>
                      </span>
                    </a>
                  </li>
                ) : null}
                {config.contact.email ? (
                  <li>
                    <a
                      href={`mailto:${config.contact.email}`}
                      className="group flex items-start gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Mail className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 pt-2">
                        <span className="block text-xs font-medium text-foreground">{t('contact.email')}</span>
                        <span className="mt-0.5 block break-all" dir="ltr">
                          {config.contact.email}
                        </span>
                      </span>
                    </a>
                  </li>
                ) : null}
                {config.contact.address ? (
                  <li className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 pt-2">
                      <span className="block text-xs font-medium text-foreground">{t('contact.address')}</span>
                      <span className="mt-0.5 block leading-relaxed">{config.contact.address}</span>
                    </span>
                  </li>
                ) : null}
                {content.hours ? (
                  <li className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock3 className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 pt-2">
                      <span className="block text-xs font-medium text-foreground">{t('contact.hours')}</span>
                      <span className="mt-0.5 block leading-relaxed">{content.hours}</span>
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {content.mapEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
              <div className="border-b border-border/60 px-4 py-3">
                <p className="text-xs font-semibold text-foreground">{t('contact.map')}</p>
              </div>
              <iframe
                title={t('contact.map')}
                src={content.mapEmbedUrl}
                className="h-64 w-full border-0 bg-muted/30"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          ) : null}
        </aside>

        <ContactForm />
      </div>
    </div>
  );
}
