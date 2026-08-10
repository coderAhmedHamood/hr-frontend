import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { PackageSearch } from 'lucide-react';
import type { StorefrontCategory, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd, productJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import { ProductPurchasePanel } from '@/features/ecommerce/storefront/components/product-purchase-panel';
import type { StorefrontLocale } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';

export async function ProductDetailPage({
  product,
  category,
}: {
  product: StorefrontProduct;
  category: StorefrontCategory | null;
}) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;
  const image = product.media.find((item) => item.isPrimary) ?? product.media[0];
  const imageAlt = image?.alt || product.imageAlt || product.name;

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('nav.products'), path: '/store/products' as const },
    ...(category ? [{ name: category.name, path: `/store/categories/${category.slug}` as const }] : []),
    { name: product.name, path: `/store/products/${product.slug}` as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={productJsonLd(product, category, locale)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />

      <StoreBreadcrumbs items={breadcrumbItems} />

      <div className="grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted md:mx-0">
          {image?.url ? (
            <Image
              src={image.url}
              alt={imageAlt}
              fill
              unoptimized
              sizes="(min-width: 768px) 26rem, 100vw"
              className="object-contain p-4"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <PackageSearch className="h-12 w-12" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          </div>

          {product.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <ProductPurchasePanel product={product} />
        </div>
      </div>
    </div>
  );
}
