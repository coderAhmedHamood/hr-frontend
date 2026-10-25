/** Strongly typed layout enums — admin reads from section definitions; renderer uses same values. */

export const HERO_CAROUSEL_LAYOUTS = ['full-bleed', 'contained'] as const;
export type HeroCarouselLayout = (typeof HERO_CAROUSEL_LAYOUTS)[number];

/** How a slide's image fills its frame: crop to fill, or show it whole. */
export const HERO_SLIDE_FITS = ['cover', 'contain'] as const;
export type HeroSlideFit = (typeof HERO_SLIDE_FITS)[number];

/** The part of a cropped slide image that stays visible. */
export const HERO_SLIDE_POSITIONS = ['top', 'center', 'bottom'] as const;
export type HeroSlidePosition = (typeof HERO_SLIDE_POSITIONS)[number];

export const CATEGORY_GRID_LAYOUTS = ['circles', 'cards', 'list'] as const;
export type CategoryGridLayout = (typeof CATEGORY_GRID_LAYOUTS)[number];

export const PRODUCT_CAROUSEL_LAYOUTS = ['carousel', 'grid'] as const;
export type ProductCarouselLayout = (typeof PRODUCT_CAROUSEL_LAYOUTS)[number];

export const FLASH_SALE_LAYOUTS = ['carousel', 'grid', 'highlight'] as const;
export type FlashSaleLayout = (typeof FLASH_SALE_LAYOUTS)[number];

export const FEATURES_GRID_LAYOUTS = ['four-column', 'three-column', 'two-column'] as const;
export type FeaturesGridLayout = (typeof FEATURES_GRID_LAYOUTS)[number];

export const BRAND_SLIDER_LAYOUTS = ['slider', 'grid'] as const;
export type BrandSliderLayout = (typeof BRAND_SLIDER_LAYOUTS)[number];

export const BANNER_LAYOUTS = ['contained', 'full-bleed', 'split'] as const;
export type BannerLayout = (typeof BANNER_LAYOUTS)[number];

export type SectionLayoutByType = {
  'hero-carousel': HeroCarouselLayout;
  'category-grid': CategoryGridLayout;
  'product-carousel': ProductCarouselLayout;
  'flash-sale': FlashSaleLayout;
  'features-grid': FeaturesGridLayout;
  'brand-slider': BrandSliderLayout;
  banner: BannerLayout;
};
