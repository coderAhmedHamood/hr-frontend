import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontHeroSlide,
  StorefrontHomepageFeature,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import type { DataSourceConfig } from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import type { PageMetadata } from '@/features/ecommerce/storefront/page-builder/domain/section-metadata';
import type {
  BannerConfig,
  BrandSliderConfig,
  CategoryGridConfig,
  FeaturesGridConfig,
  FlashSaleConfig,
  HeroCarouselConfig,
  ProductCarouselConfig,
  SectionType,
} from '@/features/ecommerce/storefront/page-builder/domain/section-types';

export type ResolvedSectionHeading = {
  title: string;
  subtitle: string;
};

type NormalizedSectionBase = {
  id: string;
  type: SectionType;
  order: number;
  heading: ResolvedSectionHeading;
  dataSource: DataSourceConfig;
};

export type NormalizedHeroCarouselSection = NormalizedSectionBase & {
  type: 'hero-carousel';
} & HeroCarouselConfig;

export type NormalizedCategoryGridSection = NormalizedSectionBase & {
  type: 'category-grid';
} & CategoryGridConfig;

export type NormalizedProductCarouselSection = NormalizedSectionBase & {
  type: 'product-carousel';
} & ProductCarouselConfig;

export type NormalizedFlashSaleSection = NormalizedSectionBase & {
  type: 'flash-sale';
} & FlashSaleConfig;

export type NormalizedFeaturesGridSection = NormalizedSectionBase & {
  type: 'features-grid';
} & FeaturesGridConfig;

export type NormalizedBrandSliderSection = NormalizedSectionBase & {
  type: 'brand-slider';
} & BrandSliderConfig;

export type NormalizedBannerSection = NormalizedSectionBase & {
  type: 'banner';
} & BannerConfig;

export type NormalizedSection =
  | NormalizedHeroCarouselSection
  | NormalizedCategoryGridSection
  | NormalizedProductCarouselSection
  | NormalizedFlashSaleSection
  | NormalizedFeaturesGridSection
  | NormalizedBrandSliderSection
  | NormalizedBannerSection;

export type ResolvedHeroCarouselSection = NormalizedHeroCarouselSection & {
  data: { slides: StorefrontHeroSlide[] };
};

export type ResolvedCategoryGridSection = NormalizedCategoryGridSection & {
  data: { categories: StorefrontCategory[] };
};

export type ResolvedProductCarouselSection = NormalizedProductCarouselSection & {
  data: { products: StorefrontProduct[] };
};

export type ResolvedFlashSaleSection = NormalizedFlashSaleSection & {
  data: { products: StorefrontProduct[] };
};

export type ResolvedFeaturesGridSection = NormalizedFeaturesGridSection & {
  data: { features: StorefrontHomepageFeature[] };
};

export type ResolvedBrandSliderSection = NormalizedBrandSliderSection & {
  data: { brands: StorefrontBrand[] };
};

export type ResolvedBannerSection = NormalizedBannerSection & {
  data: {
    imageUrl: string;
    mobileImageUrl: string;
    alt: string;
    href: `/store${string}`;
    target: '_self' | '_blank';
  };
};

export type ResolvedSection =
  | ResolvedHeroCarouselSection
  | ResolvedCategoryGridSection
  | ResolvedProductCarouselSection
  | ResolvedFlashSaleSection
  | ResolvedFeaturesGridSection
  | ResolvedBrandSliderSection
  | ResolvedBannerSection;

export type StorefrontPage = PageMetadata & {
  displayName: string;
  sections: NormalizedSection[];
};

export type StorefrontPageView = PageMetadata & {
  displayName: string;
  seoTitle: string;
  sections: ResolvedSection[];
};
