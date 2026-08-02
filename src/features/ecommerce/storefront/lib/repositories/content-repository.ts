import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import type {
  StorefrontAboutContent,
  StorefrontBlogPost,
  StorefrontContactContent,
  StorefrontFaqItem,
  StorefrontLegalPage,
  StorefrontPaginated,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import {
  mapStorefrontAbout,
  mapStorefrontBlogPost,
  mapStorefrontContact,
  mapStorefrontFaqItem,
  mapStorefrontLegal,
} from '@/features/ecommerce/storefront/lib/mappers/content-mapper';
import { mockRepositoryDelay } from '@/features/ecommerce/storefront/lib/repositories/mock-delay';
import { normalizePaginated } from '@/features/ecommerce/storefront/lib/repositories/normalize';
import contentSeed from '@/features/ecommerce/storefront/lib/mock/content-pages.json';
import blogSeed from '@/features/ecommerce/storefront/lib/mock/blog-posts.json';
import type {
  AboutPageContent,
  BlogPost,
  ContactPageContent,
  FaqItem,
  LegalPageContent,
  StorefrontContentBundle,
} from '@/features/ecommerce/storefront/domain/content';

const CONTENT_BY_COMPANY: Record<string, StorefrontContentBundle> = {
  [contentSeed.companyId]: JSON.parse(JSON.stringify(contentSeed)) as StorefrontContentBundle,
};

let BLOG_POSTS: BlogPost[] = JSON.parse(JSON.stringify(blogSeed)) as BlogPost[];

function getBundle(companyId: string): StorefrontContentBundle | null {
  return CONTENT_BY_COMPANY[companyId] ?? null;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureBundle(companyId: string): StorefrontContentBundle {
  const existing = CONTENT_BY_COMPANY[companyId];
  if (existing) return existing;
  const created: StorefrontContentBundle = {
    companyId,
    about: {
      headline: { ar: '', en: '' },
      intro: { ar: '', en: '' },
      sections: [],
      stats: [],
    },
    contact: {
      headline: { ar: '', en: '' },
      intro: { ar: '', en: '' },
    },
    faq: [],
    legal: [],
  };
  CONTENT_BY_COMPANY[companyId] = created;
  return created;
}

/** Static CMS repository for about, contact, FAQ, legal, and blog — shared by storefront + admin. */
export const storefrontContentRepository = {
  async getAbout(companyId: string, locale: StorefrontLocale): Promise<StorefrontAboutContent | null> {
    const bundle = getBundle(companyId);
    if (!bundle) return null;
    return mockRepositoryDelay(mapStorefrontAbout(bundle.about, locale));
  },

  async getContact(companyId: string, locale: StorefrontLocale): Promise<StorefrontContactContent | null> {
    const bundle = getBundle(companyId);
    if (!bundle) return null;
    return mockRepositoryDelay(mapStorefrontContact(bundle.contact, locale));
  },

  async getFaq(companyId: string, locale: StorefrontLocale): Promise<StorefrontFaqItem[]> {
    const bundle = getBundle(companyId);
    const items = bundle?.faq ?? [];
    return mockRepositoryDelay(items.map((item) => mapStorefrontFaqItem(item, locale)));
  },

  async getLegalPage(
    companyId: string,
    slug: LegalPageSlug,
    locale: StorefrontLocale,
  ): Promise<StorefrontLegalPage | null> {
    const bundle = getBundle(companyId);
    const page = bundle?.legal.find((item) => item.slug === slug) ?? null;
    if (!page) return null;
    return mockRepositoryDelay(mapStorefrontLegal(page, locale));
  },

  async listBlogPosts(
    companyId: string,
    locale: StorefrontLocale,
    options?: { page?: number; limit?: number },
  ): Promise<StorefrontPaginated<StorefrontBlogPost>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 12;
    const published = BLOG_POSTS.filter((post) => post.companyId === companyId && post.isPublished).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    const total = published.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const items = published.slice(start, start + limit).map((post) => mapStorefrontBlogPost(post, locale));
    return mockRepositoryDelay(normalizePaginated({ items, pagination: { page, limit, total, totalPages } }));
  },

  async getBlogPostBySlug(
    companyId: string,
    slug: string,
    locale: StorefrontLocale,
  ): Promise<StorefrontBlogPost | null> {
    const post = BLOG_POSTS.find(
      (item) => item.companyId === companyId && item.slug === slug && item.isPublished,
    );
    if (!post) return null;
    return mockRepositoryDelay(mapStorefrontBlogPost(post, locale));
  },

  // ── Admin CMS (raw bilingual records) ─────────────────────────────────────

  async getContentBundle(companyId: string): Promise<StorefrontContentBundle | null> {
    const bundle = getBundle(companyId);
    return mockRepositoryDelay(bundle ? clone(bundle) : null);
  },

  async saveAbout(companyId: string, about: AboutPageContent): Promise<AboutPageContent> {
    const bundle = ensureBundle(companyId);
    bundle.about = clone(about);
    return mockRepositoryDelay(clone(bundle.about));
  },

  async saveContact(companyId: string, contact: ContactPageContent): Promise<ContactPageContent> {
    const bundle = ensureBundle(companyId);
    bundle.contact = clone(contact);
    return mockRepositoryDelay(clone(bundle.contact));
  },

  async saveFaq(companyId: string, faq: FaqItem[]): Promise<FaqItem[]> {
    const bundle = ensureBundle(companyId);
    bundle.faq = clone(faq);
    return mockRepositoryDelay(clone(bundle.faq));
  },

  async saveLegalPage(companyId: string, page: LegalPageContent): Promise<LegalPageContent> {
    const bundle = ensureBundle(companyId);
    const index = bundle.legal.findIndex((item) => item.slug === page.slug);
    if (index === -1) bundle.legal.push(clone(page));
    else bundle.legal[index] = clone(page);
    return mockRepositoryDelay(clone(page));
  },

  async listBlogPostsAdmin(companyId: string): Promise<BlogPost[]> {
    const posts = BLOG_POSTS.filter((post) => post.companyId === companyId).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    return mockRepositoryDelay(clone(posts));
  },

  async saveBlogPost(input: BlogPost): Promise<BlogPost> {
    const index = BLOG_POSTS.findIndex((post) => post.id === input.id);
    if (index === -1) BLOG_POSTS.push(clone(input));
    else BLOG_POSTS[index] = clone(input);
    return mockRepositoryDelay(clone(input));
  },

  async deleteBlogPost(companyId: string, id: string): Promise<boolean> {
    const before = BLOG_POSTS.length;
    BLOG_POSTS = BLOG_POSTS.filter((post) => !(post.companyId === companyId && post.id === id));
    return mockRepositoryDelay(BLOG_POSTS.length < before);
  },
};
