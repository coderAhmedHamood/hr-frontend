import type { Metadata } from 'next';
import { ContactPage } from '@/features/ecommerce/storefront/components/contact-page';
import { contactMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontContactContent } from '@/features/ecommerce/storefront/lib/loaders/content-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const content = await getStorefrontContactContent();
  const config = await getStorefrontCompanyConfig();
  return contactMetadata(config, locale as StorefrontLocale, content.headline, content.intro);
}

export default async function Page() {
  const [content, config] = await Promise.all([getStorefrontContactContent(), getStorefrontCompanyConfig()]);
  return <ContactPage content={content} config={config} />;
}
