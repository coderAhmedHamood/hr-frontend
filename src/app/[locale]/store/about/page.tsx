import type { Metadata } from 'next';
import { AboutPage } from '@/features/ecommerce/storefront/components/about-page';
import { aboutMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontAboutContent } from '@/features/ecommerce/storefront/lib/loaders/content-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const content = await getStorefrontAboutContent();
  const config = await getStorefrontCompanyConfig();
  return aboutMetadata(config, locale as StorefrontLocale, content.headline, content.intro);
}

export default async function Page() {
  const content = await getStorefrontAboutContent();
  return <AboutPage content={content} />;
}
