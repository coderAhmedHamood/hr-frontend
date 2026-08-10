import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FaqPage } from '@/features/ecommerce/storefront/components/faq-page';
import { faqMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontFaq } from '@/features/ecommerce/storefront/lib/loaders/content-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return await faqMetadata(config, locale as StorefrontLocale, t('faq.title'));
}

export default async function Page() {
  const items = await getStorefrontFaq();
  return <FaqPage items={items} />;
}
