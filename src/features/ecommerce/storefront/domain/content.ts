import type { TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';

export type LegalPageSlug = 'privacy' | 'terms' | 'returns';

export type FaqItem = {
  id: string;
  question: LocalizableString;
  answer: LocalizableString;
};

export type ContactPageContent = {
  headline: LocalizableString;
  intro: LocalizableString;
  hours?: LocalizableString;
  mapEmbedUrl?: string;
};

export type AboutPageContent = {
  headline: LocalizableString;
  intro: LocalizableString;
  sections: {
    id: string;
    title: LocalizableString;
    body: LocalizableString;
  }[];
  stats?: {
    id: string;
    label: LocalizableString;
    value: string;
  }[];
};

export type LegalPageContent = {
  slug: LegalPageSlug;
  title: LocalizableString;
  body: LocalizableString;
  seo: {
    metaTitle?: LocalizableString;
    metaDescription?: LocalizableString;
  };
  updatedAt: string;
};

export type BlogPost = TenantScoped & {
  id: string;
  slug: string;
  title: LocalizableString;
  excerpt: LocalizableString;
  body: LocalizableString;
  coverImageUrl?: string;
  authorName: LocalizableString;
  publishedAt: string;
  seo: {
    metaTitle?: LocalizableString;
    metaDescription?: LocalizableString;
  };
  isPublished: boolean;
};

export type StorefrontContentBundle = TenantScoped & {
  about: AboutPageContent;
  contact: ContactPageContent;
  faq: FaqItem[];
  legal: LegalPageContent[];
};
