import { getLocale, getTranslations } from 'next-intl/server';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { StorefrontCompanyConfig, StorefrontContactContent } from '@/features/ecommerce/storefront/domain/storefront-models';
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

  return (
    <div className="flex flex-col gap-8">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />
      <StoreBreadcrumbs items={breadcrumbItems} />

      <header className="max-w-2xl">
        <h1 className="font-arabic-display text-3xl font-bold text-foreground">{content.headline}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{content.intro}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">{config.name}</h2>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            {config.contact.phone ? (
              <a href={`tel:${config.contact.phone}`} className="inline-flex items-center gap-2 hover:text-foreground">
                <Phone className="h-4 w-4" aria-hidden />
                <span>{t('contact.phone')}: {config.contact.phone}</span>
              </a>
            ) : null}
            {config.contact.email ? (
              <a href={`mailto:${config.contact.email}`} className="inline-flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4" aria-hidden />
                <span>{t('contact.email')}: {config.contact.email}</span>
              </a>
            ) : null}
            {config.contact.address ? (
              <span className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{t('contact.address')}: {config.contact.address}</span>
              </span>
            ) : null}
            {content.hours ? (
              <p className="pt-2 text-xs leading-relaxed">
                <span className="font-medium text-foreground">{t('contact.hours')}: </span>
                {content.hours}
              </p>
            ) : null}
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
