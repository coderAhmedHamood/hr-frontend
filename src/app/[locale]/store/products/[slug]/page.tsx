import type { Metadata } from 'next';
import { ProductDetailPage } from '@/features/ecommerce/storefront/components/product-detail-page';
import { productMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCategoryById, getStorefrontProductBySlug } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  const config = await getStorefrontCompanyConfig();
  return productMetadata(product, config, locale as StorefrontLocale);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  const category = product.categoryId ? await getStorefrontCategoryById(product.categoryId) : null;

  return <ProductDetailPage product={product} category={category} />;
}
