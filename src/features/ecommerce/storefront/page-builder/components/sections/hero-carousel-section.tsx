import type { ResolvedHeroCarouselSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { HeroCarousel } from '@/features/ecommerce/storefront/components/catalog/hero-carousel';

export function HeroCarouselSection({ section }: { section: ResolvedHeroCarouselSection }) {
  const slides = section.data.slides;
  if (slides.length === 0) return null;

  return (
    <HeroCarousel
      slides={slides}
      title={section.heading.title || undefined}
      subtitle={section.heading.subtitle || undefined}
      autoplay={section.settings.autoplay}
      intervalMs={section.settings.intervalMs}
      layout={section.style.layout}
      heightRatio={section.style.height}
    />
  );
}
