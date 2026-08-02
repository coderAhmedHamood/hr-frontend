import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import type {
  CategoryDataSource,
  CollectionDataSource,
  ManualDataSource,
  QueryDataSource,
  RecommendationDataSource,
  TagDataSource,
} from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import type { SectionMetadata } from '@/features/ecommerce/storefront/page-builder/domain/section-metadata';
import type {
  BannerLayout,
  BrandSliderLayout,
  CategoryGridLayout,
  FeaturesGridLayout,
  FlashSaleLayout,
  HeroCarouselLayout,
  ProductCarouselLayout,
} from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import type { SectionStyleBase } from '@/features/ecommerce/storefront/page-builder/domain/section-style';

export const SECTION_TYPES = [
  'hero-carousel',
  'category-grid',
  'product-carousel',
  'flash-sale',
  'features-grid',
  'brand-slider',
  'banner',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export type LocalizedSectionHeading = {
  title: LocalizableString | null;
  subtitle: LocalizableString | null;
};

// ─── Hero Carousel ───────────────────────────────────────────────────────────

export type HeroCarouselSlideRecord = {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  title?: LocalizableString;
  alt?: LocalizableString;
  href?: `/store${string}`;
};

export type HeroCarouselContent = LocalizedSectionHeading & {
  slides: HeroCarouselSlideRecord[];
};

export type HeroCarouselSettings = {
  autoplay: boolean;
  intervalMs: number;
};

export type HeroCarouselStyle = SectionStyleBase<HeroCarouselLayout> & {
  height: string;
};

export type HeroCarouselConfig = {
  content: HeroCarouselContent;
  settings: HeroCarouselSettings;
  style: HeroCarouselStyle;
  dataSource: ManualDataSource;
};

// ─── Category Grid ───────────────────────────────────────────────────────────

export type CategoryGridContent = LocalizedSectionHeading;

export type CategoryGridSettings = {
  showLabels: boolean;
  columns: { mobile: number; tablet: number; desktop: number };
};

export type CategoryGridStyle = SectionStyleBase<CategoryGridLayout>;

export type CategoryGridConfig = {
  content: CategoryGridContent;
  settings: CategoryGridSettings;
  style: CategoryGridStyle;
  dataSource: ManualDataSource | CollectionDataSource | QueryDataSource;
};

// ─── Product Carousel ────────────────────────────────────────────────────────

export type ProductCarouselContent = LocalizedSectionHeading & {
  viewAllHref: `/store${string}` | null;
};

export type ProductCarouselSettings = {
  autoplay: boolean;
  showPrice: boolean;
  showBadge: boolean;
};

export type ProductCarouselStyle = SectionStyleBase<ProductCarouselLayout>;

export type ProductCarouselConfig = {
  content: ProductCarouselContent;
  settings: ProductCarouselSettings;
  style: ProductCarouselStyle;
  dataSource:
    | ManualDataSource
    | QueryDataSource
    | TagDataSource
    | CategoryDataSource
    | CollectionDataSource
    | RecommendationDataSource;
};

// ─── Flash Sale ──────────────────────────────────────────────────────────────

export type FlashSaleContent = LocalizedSectionHeading & {
  viewAllHref: `/store${string}` | null;
};

export type FlashSaleSettings = {
  showPrice: boolean;
  showCountdown: boolean;
  endsAt: string | null;
};

export type FlashSaleStyle = SectionStyleBase<FlashSaleLayout>;

export type FlashSaleConfig = {
  content: FlashSaleContent;
  settings: FlashSaleSettings;
  style: FlashSaleStyle;
  dataSource: TagDataSource | QueryDataSource;
};

// ─── Features Grid ───────────────────────────────────────────────────────────

export type FeatureItemRecord = {
  id: string;
  icon: 'truck' | 'shield' | 'sparkles' | 'headphones';
  title: LocalizableString;
  description: LocalizableString;
};

export type FeaturesGridContent = LocalizedSectionHeading & {
  items: FeatureItemRecord[];
};

export type FeaturesGridSettings = {
  columns: { mobile: number; tablet: number; desktop: number };
};

export type FeaturesGridStyle = SectionStyleBase<FeaturesGridLayout>;

export type FeaturesGridConfig = {
  content: FeaturesGridContent;
  settings: FeaturesGridSettings;
  style: FeaturesGridStyle;
  dataSource: ManualDataSource;
};

// ─── Brand Slider ────────────────────────────────────────────────────────────

export type BrandSliderContent = LocalizedSectionHeading & {
  viewAllHref: `/store${string}` | null;
};

export type BrandSliderSettings = {
  showLogo: boolean;
};

export type BrandSliderStyle = SectionStyleBase<BrandSliderLayout>;

export type BrandSliderConfig = {
  content: BrandSliderContent;
  settings: BrandSliderSettings;
  style: BrandSliderStyle;
  dataSource: ManualDataSource | CollectionDataSource;
};

// ─── Banner ──────────────────────────────────────────────────────────────────

export type BannerContent = {
  imageUrl: string;
  mobileImageUrl: string | null;
  alt: LocalizableString;
  href: `/store${string}`;
  target: '_self' | '_blank';
};

export type BannerSettings = Record<string, never>;

export type BannerStyle = SectionStyleBase<BannerLayout>;

export type BannerConfig = {
  content: BannerContent;
  settings: BannerSettings;
  style: BannerStyle;
  dataSource: ManualDataSource;
};

// ─── Section record union (CMS DTO) ───────────────────────────────────────────

type SectionRecordBase = SectionMetadata & {
  type: SectionType;
};

export type HeroCarouselSectionRecord = SectionRecordBase & { type: 'hero-carousel' } & HeroCarouselConfig;
export type CategoryGridSectionRecord = SectionRecordBase & { type: 'category-grid' } & CategoryGridConfig;
export type ProductCarouselSectionRecord = SectionRecordBase & { type: 'product-carousel' } & ProductCarouselConfig;
export type FlashSaleSectionRecord = SectionRecordBase & { type: 'flash-sale' } & FlashSaleConfig;
export type FeaturesGridSectionRecord = SectionRecordBase & { type: 'features-grid' } & FeaturesGridConfig;
export type BrandSliderSectionRecord = SectionRecordBase & { type: 'brand-slider' } & BrandSliderConfig;
export type BannerSectionRecord = SectionRecordBase & { type: 'banner' } & BannerConfig;

export type SectionRecord =
  | HeroCarouselSectionRecord
  | CategoryGridSectionRecord
  | ProductCarouselSectionRecord
  | FlashSaleSectionRecord
  | FeaturesGridSectionRecord
  | BrandSliderSectionRecord
  | BannerSectionRecord;
