import type { Inventory, MediaItem, Money, StockStatus, ProductStatus } from '@/features/ecommerce/domain/types';
import type { CompanyThemeColors, CompanyContactInfo } from '@/features/ecommerce/storefront/domain/company-config';
import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import type { StorefrontTypography } from '@/features/ecommerce/storefront/lib/storefront-fonts';

export type StorefrontHomepageFeature = {
  id: string;
  title: string;
  description: string;
  icon: 'truck' | 'shield' | 'sparkles' | 'headphones';
};

/** Locale-resolved product — UI consumes this only. */
export type StorefrontProduct = {
  id: string;
  companyId: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  brandId: string | null;
  categoryId: string | null;
  status: ProductStatus;
  stockStatus: StockStatus;
  inventory: Inventory;
  price: Money;
  compareAtPrice: Money | null;
  media: MediaItem[];
  imageUrl: string | null;
  imageAlt: string;
  tags: string[];
  /** Active promo flags from inventory (computed server-side). */
  isNewProductActive?: boolean;
  isTodayDealActive?: boolean;
  isWholesaleActive?: boolean;
  isDiscountActive?: boolean;
  discountPercent?: number | null;
  wholesalePrice?: Money | null;
  metaTitle: string;
  metaDescription: string;
  rating: number | null;
  reviewCount: number;
  /** Attribute lines for variant pickers (when product has variants). */
  attributes: Array<{
    id: string;
    nameAr: string;
    displayType: string;
    values: Array<{
      id: string;
      nameAr: string;
      colorHex?: string;
      imageUrl?: string;
      images?: MediaItem[];
      description?: string;
    }>;
  }>;
  variants: Array<{
    id: string;
    combinationKey: string;
    sku: string;
    nameAr: string;
    attributeValueIds: string[];
    attributeLabels: Array<{ attributeNameAr: string; valueNameAr: string; colorHex?: string }>;
    price: Money;
    quantity: number;
    stockStatus: StockStatus;
    isActive: boolean;
  }>;
};

export type StorefrontCategory = {
  id: string;
  companyId: string;
  slug: string;
  name: string;
  description: string;
  parentId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  displayOrder: number;
  featuredBrandIds: string[];
  metaTitle: string;
  metaDescription: string;
};

export type StorefrontBrand = {
  id: string;
  companyId: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  metaTitle: string;
  metaDescription: string;
};

export type StorefrontNavItem = {
  label: string;
  href: `/store${string}` | '/store';
};

export type StorefrontCompanyConfig = {
  id: string;
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  seo: {
    homeTitle: string;
    homeDescription: string;
    productsTitle: string;
    productsDescription: string;
    keywords: string[];
    defaultOgImage: string | null;
  };
  contact: CompanyContactInfo;
  social: Partial<Record<import('@/features/ecommerce/storefront/domain/company-config').CompanySocialNetwork, string>>;
  theme: CompanyThemeColors;
  /** Runtime CSS variable overrides for the store shell (HSL channels). */
  themeCssVars?: Record<string, string>;
  /** Curated Google Font preset ids — applied only under /store. */
  typography: StorefrontTypography;
  navigation: StorefrontNavItem[];
  secondaryNavigation: (StorefrontNavItem & { highlight?: boolean })[];
  footer: {
    copyrightOwnerName: string;
    tagline: string;
    commercialRegistration: string | null;
    linkGroups: {
      id: string;
      title: string;
      links: StorefrontNavItem[];
    }[];
  };
  announcement: {
    enabled: boolean;
    items: Array<{
      id: string;
      message: string;
      href: `/store${string}` | '/store' | null;
    }>;
    dismissible: boolean;
    /** When false, messages stay static (no marquee). */
    scrolling: boolean;
    /** Duration of one full marquee loop in milliseconds. */
    speedMs: number;
  };
  checkout: {
    cities: string[];
    defaultCity: string;
    freeShippingThreshold: number;
    standardShippingFee: number;
    paymentMethods: Array<'cash_on_delivery' | 'card'>;
  };
  storePages: {
    offers: boolean;
    wholesale: boolean;
  };
  currency: string;
  timezone: string;
};

export type StorefrontHeroSlide = {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  title: string;
  alt: string;
  href: `/store${string}` | null;
};

export type StorefrontFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type StorefrontAboutContent = {
  headline: string;
  intro: string;
  sections: { id: string; title: string; body: string }[];
  stats: { id: string; label: string; value: string }[];
};

export type StorefrontContactContent = {
  headline: string;
  intro: string;
  hours: string;
  mapEmbedUrl: string | null;
};

export type StorefrontLegalPage = {
  slug: LegalPageSlug;
  title: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  updatedAt: string;
};

export type StorefrontPaginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
