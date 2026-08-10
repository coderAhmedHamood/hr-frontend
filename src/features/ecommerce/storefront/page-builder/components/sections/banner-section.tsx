import type { ResolvedBannerSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { PromoBanner } from '@/features/ecommerce/storefront/components/catalog/promo-banner';

export function BannerSection({ section }: { section: ResolvedBannerSection }) {
  const banner = section.data;

  return (
    <PromoBanner
      imageUrl={banner.imageUrl}
      mobileImageUrl={banner.mobileImageUrl}
      alt={banner.alt}
      href={banner.href}
      target={banner.target}
      layout={section.style.layout}
    />
  );
}
