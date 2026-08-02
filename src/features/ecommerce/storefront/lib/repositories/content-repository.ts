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
import type {
  AboutPageContent,
  ContactPageContent,
  FaqItem,
  LegalPageContent,
  StorefrontContentBundle,
} from '@/features/ecommerce/storefront/domain/content';
import {
  fetchAdminContentBundle,
  fetchPublicAbout,
  fetchPublicContact,
  fetchPublicFaq,
  fetchPublicLegal,
  isStoreHttpEnabled,
  saveAdminAbout,
  saveAdminContact,
  saveAdminFaq,
  saveAdminLegalPage,
} from '@/features/ecommerce/shared/lib/api/store-content-api';

/** HTTP-only CMS content — store-frontend-binding.md §3 / §8. No seed fallback. */
export const storefrontContentRepository = {
  async getAbout(companyId: string, locale: StorefrontLocale): Promise<StorefrontAboutContent | null> {
    if (!isStoreHttpEnabled()) return null;
    const about = await fetchPublicAbout(companyId);
    return about ? mapStorefrontAbout(about, locale) : null;
  },

  async getContact(
    companyId: string,
    locale: StorefrontLocale,
  ): Promise<StorefrontContactContent | null> {
    if (!isStoreHttpEnabled()) return null;
    const contact = await fetchPublicContact(companyId);
    return contact ? mapStorefrontContact(contact, locale) : null;
  },

  async getFaq(companyId: string, locale: StorefrontLocale): Promise<StorefrontFaqItem[]> {
    if (!isStoreHttpEnabled()) return [];
    const items = await fetchPublicFaq(companyId);
    return items.map((item) => mapStorefrontFaqItem(item, locale));
  },

  async getLegalPage(
    companyId: string,
    slug: LegalPageSlug,
    locale: StorefrontLocale,
  ): Promise<StorefrontLegalPage | null> {
    if (!isStoreHttpEnabled()) return null;
    const page = await fetchPublicLegal(companyId, slug);
    return page ? mapStorefrontLegal(page, locale) : null;
  },

  async getContentBundle(companyId: string): Promise<StorefrontContentBundle | null> {
    if (!isStoreHttpEnabled()) return null;
    return fetchAdminContentBundle(companyId);
  },

  async saveAbout(companyId: string, about: AboutPageContent): Promise<AboutPageContent> {
    if (!isStoreHttpEnabled()) throw new Error('STORE_HTTP_DISABLED');
    return saveAdminAbout(companyId, about);
  },

  async saveContact(companyId: string, contact: ContactPageContent): Promise<ContactPageContent> {
    if (!isStoreHttpEnabled()) throw new Error('STORE_HTTP_DISABLED');
    return saveAdminContact(companyId, contact);
  },

  async saveFaq(companyId: string, faq: FaqItem[]): Promise<FaqItem[]> {
    if (!isStoreHttpEnabled()) throw new Error('STORE_HTTP_DISABLED');
    return saveAdminFaq(companyId, faq);
  },

  async saveLegalPage(companyId: string, page: LegalPageContent): Promise<LegalPageContent> {
    if (!isStoreHttpEnabled()) throw new Error('STORE_HTTP_DISABLED');
    return saveAdminLegalPage(companyId, page);
  },
};
