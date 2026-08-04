import type { Metadata } from 'next';
import { BrandDetailPage } from '@/features/ecommerce/storefront/components/brand-detail-page';
import { BrandDetailPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { brandMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontBrandBySlug, getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale, slug } = await params;
  const brand = await getStorefrontBrandBySlug(slug);
  const config = await getStorefrontCompanyConfig();
  return brandMetadata(brand, config, locale as StorefrontLocale);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  if (isStorefrontCsrEnabled()) return <BrandDetailPageCsr slug={slug} />;

  const brand = await getStorefrontBrandBySlug(slug);
  const productsResult = await getStorefrontProductsList({ brandId: brand.id, limit: 24 });

  return <BrandDetailPage brand={brand} products={productsResult.items} />;
}
