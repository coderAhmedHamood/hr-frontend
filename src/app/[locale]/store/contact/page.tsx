import type { Metadata } from 'next';
import { ContactPage } from '@/features/ecommerce/storefront/components/contact-page';
import { ContactPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { contactMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontContactContent } from '@/features/ecommerce/storefront/lib/loaders/content-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale } = await params;
  const content = await getStorefrontContactContent();
  const config = await getStorefrontCompanyConfig();
  return contactMetadata(config, locale as StorefrontLocale, content.headline, content.intro);
}

export default async function Page() {
  if (isStorefrontCsrEnabled()) return <ContactPageCsr />;
  const [content, config] = await Promise.all([getStorefrontContactContent(), getStorefrontCompanyConfig()]);
  return <ContactPage content={content} config={config} />;
}
