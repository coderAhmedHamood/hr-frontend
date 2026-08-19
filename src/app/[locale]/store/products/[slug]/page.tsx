import type { Metadata } from 'next';
import { ProductDetailPage } from '@/features/ecommerce/storefront/components/product-detail-page';
import { ProductDetailPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { productMetadata } from '@/features/ecommerce/storefront/lib/seo';
import {
  getStorefrontCategoryById,
  getStorefrontProductBySlug,
  getStorefrontProductsList,
} from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale, slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  const config = await getStorefrontCompanyConfig();
  return productMetadata(product, config, locale as StorefrontLocale);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  if (isStorefrontCsrEnabled()) return <ProductDetailPageCsr slug={slug} />;

  const product = await getStorefrontProductBySlug(slug);
  const [category, related] = await Promise.all([
    product.categoryId ? getStorefrontCategoryById(product.categoryId) : Promise.resolve(null),
    getStorefrontProductsList({ tag: 'best-seller', limit: 10 }),
  ]);

  return (
    <ProductDetailPage
      product={product}
      category={category}
      relatedProducts={related.items}
    />
  );
}
