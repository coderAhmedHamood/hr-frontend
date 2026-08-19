import type { ResolvedBannerSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { PromoBanner } from '@/features/ecommerce/storefront/components/catalog/promo-banner';
import { resolveStorefrontImageSrc } from '@/features/ecommerce/storefront/lib/resolve-storefront-image-src';

export function BannerSection({ section }: { section: ResolvedBannerSection }) {
  const banner = section.data;
  const imageUrl = resolveStorefrontImageSrc(banner.imageUrl);
  const mobileImageUrl = resolveStorefrontImageSrc(banner.mobileImageUrl) ?? imageUrl;

  if (!imageUrl && !mobileImageUrl) return null;

  return (
    <PromoBanner
      imageUrl={imageUrl ?? mobileImageUrl ?? ''}
      mobileImageUrl={mobileImageUrl}
      alt={banner.alt}
      href={banner.href}
      target={banner.target}
      layout={section.style.layout}
    />
  );
}
