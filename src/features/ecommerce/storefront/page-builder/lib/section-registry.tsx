import type { ReactElement } from 'react';
import type { ResolvedSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { SectionType } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import { BannerSection } from '@/features/ecommerce/storefront/page-builder/components/sections/banner-section';
import { BrandSliderSection } from '@/features/ecommerce/storefront/page-builder/components/sections/brand-slider-section';
import { CategoryGridSection } from '@/features/ecommerce/storefront/page-builder/components/sections/category-grid-section';
import { FeaturesGridSection } from '@/features/ecommerce/storefront/page-builder/components/sections/features-grid-section';
import { FlashSaleSection } from '@/features/ecommerce/storefront/page-builder/components/sections/flash-sale-section';
import { HeroCarouselSection } from '@/features/ecommerce/storefront/page-builder/components/sections/hero-carousel-section';
import { ProductCarouselSection } from '@/features/ecommerce/storefront/page-builder/components/sections/product-carousel-section';
import { SECTION_DEFINITION_REGISTRY } from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';

type SectionRenderEntry = {
  render: (section: ResolvedSection) => Promise<ReactElement | null>;
};

const SECTION_RENDER_REGISTRY: Record<SectionType, SectionRenderEntry> = {
  'hero-carousel': {
    render: async (section) => {
      if (section.type !== 'hero-carousel') return null;
      return <HeroCarouselSection section={section} />;
    },
  },
  'category-grid': {
    render: async (section) => {
      if (section.type !== 'category-grid') return null;
      return <CategoryGridSection section={section} />;
    },
  },
  'product-carousel': {
    render: async (section) => {
      if (section.type !== 'product-carousel') return null;
      return <ProductCarouselSection section={section} />;
    },
  },
  'flash-sale': {
    render: async (section) => {
      if (section.type !== 'flash-sale') return null;
      return <FlashSaleSection section={section} />;
    },
  },
  'features-grid': {
    render: async (section) => {
      if (section.type !== 'features-grid') return null;
      return <FeaturesGridSection section={section} />;
    },
  },
  'brand-slider': {
    render: async (section) => {
      if (section.type !== 'brand-slider') return null;
      return <BrandSliderSection section={section} />;
    },
  },
  banner: {
    render: async (section) => {
      if (section.type !== 'banner') return null;
      return <BannerSection section={section} />;
    },
  },
};

export function getSectionRenderEntry(type: SectionType): SectionRenderEntry | null {
  if (!SECTION_DEFINITION_REGISTRY[type]) return null;
  return SECTION_RENDER_REGISTRY[type] ?? null;
}

export async function renderSectionComponent(section: ResolvedSection): Promise<ReactElement | null> {
  const entry = getSectionRenderEntry(section.type);
  if (!entry) return null;
  return entry.render(section);
}
