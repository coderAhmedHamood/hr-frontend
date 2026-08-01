import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import type {
  StorefrontAboutContent,
  StorefrontContactContent,
  StorefrontFaqItem,
  StorefrontLegalPage,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import {
  mapStorefrontAbout,
  mapStorefrontContact,
  mapStorefrontFaqItem,
  mapStorefrontLegal,
} from '@/features/ecommerce/storefront/lib/mappers/content-mapper';
import { mockRepositoryDelay } from '@/features/ecommerce/storefront/lib/repositories/mock-delay';
import contentSeed from '@/features/ecommerce/storefront/lib/mock/content-pages.json';
import type {
  AboutPageContent,
  ContactPageContent,
  FaqItem,
  LegalPageContent,
  StorefrontContentBundle,
} from '@/features/ecommerce/storefront/domain/content';

/** Shared across Server Actions + RSC (avoids duplicate module instances). */
const globalForContent = globalThis as typeof globalThis & {
  __ecommerceContentByCompany?: Record<string, StorefrontContentBundle>;
};

const CONTENT_BY_COMPANY: Record<string, StorefrontContentBundle> =
  globalForContent.__ecommerceContentByCompany ??
  (globalForContent.__ecommerceContentByCompany = {
    [contentSeed.companyId]: JSON.parse(JSON.stringify(contentSeed)) as StorefrontContentBundle,
  });

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

/** Static CMS repository for about, contact, FAQ, and legal — shared by storefront + admin. */
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
};
