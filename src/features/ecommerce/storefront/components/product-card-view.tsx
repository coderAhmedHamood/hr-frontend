'use client';

import { Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { AddToCartButton } from '@/features/ecommerce/storefront/components/catalog/add-to-cart-button';
import { FavoriteButton } from '@/features/ecommerce/storefront/components/catalog/favorite-button';
import { ProductCardMedia } from '@/features/ecommerce/storefront/components/catalog/product-card-media';
import { ProductPrice } from '@/features/ecommerce/storefront/components/catalog/product-price';
import { ProductRating } from '@/features/ecommerce/storefront/components/catalog/product-rating';
import { buildProductDisplay } from '@/features/ecommerce/storefront/lib/product-display';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

export type ProductCardVariant = 'grid' | 'compact' | 'horizontal';

type ProductCardViewProps = {
  product: StorefrontProduct;
  brandName?: string;
  formattedPrice: string;
  formattedComparePrice?: string;
  stockLabel: string;
  variant?: ProductCardVariant;
};

export function ProductCardView({
  product,
  brandName,
  formattedPrice,
  formattedComparePrice,
  stockLabel,
  variant = 'grid',
}: ProductCardViewProps) {
  const t = useTranslations('storefront');
  const display = buildProductDisplay(product);
  const productHref = `/store/products/${product.slug}` as const;

  if (variant === 'horizontal') {
    return (
      <article className="group flex gap-3 overflow-hidden rounded-lg border border-border bg-card p-3">
        <div className="relative w-24 shrink-0 sm:w-28">
          <ProductCardMedia
            images={display.images.slice(0, 1)}
            fallbackAlt={display.imageAlt}
            href={productHref}
            aspectRatio="square"
            className="overflow-hidden rounded-md"
            imageClassName="p-2"
            sizes="112px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {brandName ? <p className="text-xs text-muted-foreground">{brandName}</p> : null}
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            <Link href={productHref} prefetch={false} className="hover:text-primary">
              {product.name}
            </Link>
          </h3>
          <ProductRating rating={display.rating} reviewCount={display.reviewCount} />
          <ProductPrice
            price={formattedPrice}
            compareAtPrice={formattedComparePrice}
            discountPercent={display.discountPercent}
            muted={display.outOfStock}
            size="sm"
          />
          {display.outOfStock ? (
            <span className="text-xs font-medium text-muted-foreground">{stockLabel}</span>
          ) : null}
          <div className="mt-auto flex items-center gap-2 pt-1">
            <FavoriteButton productId={product.id} variant="outline" />
            <AddToCartButton productId={product.id} stockStatus={product.stockStatus} variant="button" className="flex-1" />
          </div>
        </div>
      </article>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow duration-200 hover:shadow-soft',
        isCompact && 'text-sm',
      )}
    >
      <div className="relative shrink-0 bg-muted/20">
        <ProductCardMedia
          images={display.images}
          fallbackAlt={display.imageAlt}
          href={productHref}
          aspectRatio="square"
          imageClassName={isCompact ? 'p-2' : 'p-4'}
        />

        <FavoriteButton
          productId={product.id}
          variant="overlay"
          className="absolute end-2 top-2 z-10"
        />

        {display.promoBadge ? (
          <span
            className={cn(
              'pointer-events-none absolute start-0 top-0 z-10 max-w-[75%] truncate',
              'rounded-none rounded-ee-2xl px-2.5 py-1.5',
              'text-[10px] font-bold leading-none tracking-wide text-primary-foreground shadow-soft',
              display.promoBadge === 'best-seller' && 'bg-primary',
              display.promoBadge === 'deals' && 'bg-secondary text-secondary-foreground',
              display.promoBadge === 'wholesale' && 'bg-foreground text-background',
            )}
          >
            {display.promoBadge === 'best-seller'
              ? t('components.badgeBestSeller')
              : display.promoBadge === 'wholesale'
                ? t('components.badgeWholesale')
                : t('components.badgeDeals')}
          </span>
        ) : null}

        {!display.outOfStock ? (
          <AddToCartButton
            productId={product.id}
            stockStatus={product.stockStatus}
            variant="quick"
            className="absolute bottom-2 end-2 z-10"
          />
        ) : null}

        {display.outOfStock ? (
          <span className="pointer-events-none absolute bottom-2 end-2 z-10 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-muted-foreground">
            {stockLabel}
          </span>
        ) : null}
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col gap-1.5', isCompact ? 'p-2' : 'p-2.5')}>
        {brandName ? (
          <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]">{brandName}</p>
        ) : null}

        <h3
          className={cn(
            'line-clamp-2 min-h-[2.5rem] font-medium leading-snug text-foreground',
            isCompact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm',
          )}
        >
          <Link href={productHref} prefetch={false} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>

        <div className="min-h-[1.25rem]">
          <ProductRating rating={display.rating} reviewCount={display.reviewCount} />
        </div>

        <div className="mt-auto min-w-0">
          <ProductPrice
            price={formattedPrice}
            compareAtPrice={formattedComparePrice}
            discountPercent={display.discountPercent}
            muted={display.outOfStock}
            size="sm"
            className={cn(display.outOfStock && 'opacity-60')}
          />
        </div>

        {display.sellingFast ? (
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Package className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
            <span className="truncate">{t('components.sellingFast')}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}

/** Horizontal list row — alias for ProductCardView variant. */
export function ProductListItem(props: ProductCardViewProps) {
  return <ProductCardView {...props} variant="horizontal" />;
}
