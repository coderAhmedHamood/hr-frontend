import type { Inventory, MediaItem, Money, StockStatus, ProductStatus } from '@/features/ecommerce/domain/types';
import type { CompanyThemeColors, CompanyContactInfo, CompanySocialLinks } from '@/features/ecommerce/storefront/domain/company-config';
import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';

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
  metaTitle: string;
  metaDescription: string;
  /** Attribute lines for variant pickers (when product has variants). */
  attributes: Array<{
    id: string;
    nameAr: string;
    displayType: string;
    values: Array<{ id: string; nameAr: string; colorHex?: string; imageUrl?: string }>;
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
    defaultOgImage: string | null;
  };
  contact: CompanyContactInfo;
  social: CompanySocialLinks;
  theme: CompanyThemeColors;
  navigation: StorefrontNavItem[];
  secondaryNavigation: (StorefrontNavItem & { highlight?: boolean })[];
  footer: {
    copyrightOwnerName: string;
    commercialRegistration: string | null;
    linkGroups: {
      id: string;
      title: string;
      links: StorefrontNavItem[];
    }[];
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

export type StorefrontBlogPost = {
  id: string;
  companyId: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
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
