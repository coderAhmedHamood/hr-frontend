import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPage } from '@/features/ecommerce/storefront/components/legal-page';
import { legalMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontLegalPage } from '@/features/ecommerce/storefront/lib/loaders/content-loaders';
import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string }>;

const VALID_SLUGS: LegalPageSlug[] = ['privacy', 'terms', 'returns'];

function isLegalSlug(slug: string): slug is LegalPageSlug {
  return VALID_SLUGS.includes(slug as LegalPageSlug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLegalSlug(slug)) return {};
  const page = await getStorefrontLegalPage(slug);
  const config = await getStorefrontCompanyConfig();
  return legalMetadata(page, config, locale as StorefrontLocale);
}

export default async function Page({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  const page = await getStorefrontLegalPage(slug);
  return <LegalPage page={page} locale={locale as StorefrontLocale} />;
}
