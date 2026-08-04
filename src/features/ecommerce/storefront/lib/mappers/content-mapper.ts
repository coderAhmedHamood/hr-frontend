import type {
  AboutPageContent,
  BlogPost,
  ContactPageContent,
  FaqItem,
  LegalPageContent,
  StorefrontContentBundle,
} from '@/features/ecommerce/storefront/domain/content';
import type {
  StorefrontAboutContent,
  StorefrontBlogPost,
  StorefrontContactContent,
  StorefrontFaqItem,
  StorefrontLegalPage,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import { resolveLocalizedOptional, resolveLocalizedText } from '@/features/ecommerce/storefront/domain/localizable';

export function mapStorefrontFaqItem(item: FaqItem, locale: StorefrontLocale): StorefrontFaqItem {
  return {
    id: item.id,
    question: resolveLocalizedText(item.question, locale),
    answer: resolveLocalizedText(item.answer, locale),
  };
}

export function mapStorefrontAbout(content: AboutPageContent, locale: StorefrontLocale): StorefrontAboutContent {
  return {
    headline: resolveLocalizedText(content.headline, locale),
    intro: resolveLocalizedText(content.intro, locale),
    sections: content.sections.map((section) => ({
      id: section.id,
      title: resolveLocalizedText(section.title, locale),
      body: resolveLocalizedText(section.body, locale),
    })),
    stats: (content.stats ?? []).map((stat) => ({
      id: stat.id,
      label: resolveLocalizedText(stat.label, locale),
      value: stat.value,
    })),
  };
}

export function mapStorefrontContact(content: ContactPageContent, locale: StorefrontLocale): StorefrontContactContent {
  return {
    headline: resolveLocalizedText(content.headline, locale),
    intro: resolveLocalizedText(content.intro, locale),
    hours: resolveLocalizedOptional(content.hours, locale) ?? '',
    mapEmbedUrl: content.mapEmbedUrl ?? null,
  };
}

export function mapStorefrontLegal(page: LegalPageContent, locale: StorefrontLocale): StorefrontLegalPage {
  const title = resolveLocalizedText(page.title, locale);
  return {
    slug: page.slug,
    title,
    body: resolveLocalizedText(page.body, locale),
    metaTitle: resolveLocalizedOptional(page.seo.metaTitle, locale) ?? title,
    metaDescription: resolveLocalizedOptional(page.seo.metaDescription, locale) ?? title,
    updatedAt: page.updatedAt,
  };
}

export function mapStorefrontBlogPost(post: BlogPost, locale: StorefrontLocale): StorefrontBlogPost {
  const title = resolveLocalizedText(post.title, locale);
  const excerpt = resolveLocalizedText(post.excerpt, locale);
  return {
    id: post.id,
    companyId: post.companyId,
    slug: post.slug,
    title,
    excerpt,
    body: resolveLocalizedText(post.body, locale),
    coverImageUrl: post.coverImageUrl ?? null,
    authorName: resolveLocalizedText(post.authorName, locale),
    publishedAt: post.publishedAt,
    metaTitle: resolveLocalizedOptional(post.seo.metaTitle, locale) ?? title,
    metaDescription: resolveLocalizedOptional(post.seo.metaDescription, locale) ?? excerpt,
  };
}

export function mapStorefrontContentBundle(bundle: StorefrontContentBundle, locale: StorefrontLocale) {
  return {
    about: mapStorefrontAbout(bundle.about, locale),
    contact: mapStorefrontContact(bundle.contact, locale),
    faq: bundle.faq.map((item) => mapStorefrontFaqItem(item, locale)),
    legal: bundle.legal.map((page) => mapStorefrontLegal(page, locale)),
  };
}
