import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type { StorefrontPage } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { PageType } from '@/features/ecommerce/storefront/page-builder/domain/page-types';
import type { PageCmsPort, PageStorefrontPort } from '@/features/ecommerce/storefront/page-builder/domain/page.ports';
import { mapStorefrontPage } from '@/features/ecommerce/storefront/page-builder/lib/mappers/page-mapper';
import { pageRecordSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
import type { StorefrontLocale } from '@/i18n/routing';
import { isStoreHttpEnabled } from '@/features/ecommerce/storefront/lib/api/store-http';
import {
  fetchAdminHomepage,
  fetchPublicHomepage,
  saveAdminHomepage,
} from '@/features/ecommerce/shared/lib/api/store-pages-api';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

/** Drop retired section types so they no longer appear in CMS or storefront. */
function withoutRetiredSections(record: PageRecord): PageRecord {
  return {
    ...record,
    sections: record.sections.filter((section) => section.type !== 'features-grid'),
  };
}

function isPubliclyVisible(record: PageRecord): boolean {
  return record.status === 'published';
}

export type PageSaveError = {
  code: 'VALIDATION_FAILED';
  message: string;
  issues: unknown;
};

/**
 * Homepage pages — HTTP only (store-frontend-binding.md).
 * No seed JSON / in-memory PAGE_INDEX.
 */
export const storefrontPageRepository: PageStorefrontPort & PageCmsPort = {
  async getByPageType(
    companyId: string,
    pageType: PageType,
    locale: StorefrontLocale,
  ): Promise<StorefrontPage | null> {
    if (!isStoreHttpEnabled()) return null;
    if (pageType !== 'homepage') return null;

    const httpRecord = await fetchPublicHomepage(companyId);
    if (!httpRecord || !isPubliclyVisible(httpRecord)) return null;
    return mapStorefrontPage(withoutRetiredSections(httpRecord), locale);
  },

  async getBySlug(
    companyId: string,
    slug: string,
    locale: StorefrontLocale,
  ): Promise<StorefrontPage | null> {
    if (!isStoreHttpEnabled()) return null;
    if (slug !== 'home' && slug !== 'homepage') return null;
    return this.getByPageType(companyId, 'homepage', locale);
  },

  async getRecordByPageType(companyId: string, pageType: PageType): Promise<PageRecord | null> {
    if (!isStoreHttpEnabled()) return null;
    if (pageType !== 'homepage') return null;

    const httpRecord = await fetchAdminHomepage(companyId);
    if (httpRecord) return withoutRetiredSections(httpRecord);

    // First-time CMS: empty draft shell (not a seeded mock page).
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      companyId: resolveStorefrontCompanyId(companyId),
      pageType: 'homepage',
      slug: 'home',
      schemaVersion: 1,
      contentVersion: 0,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      createdBy: null,
      updatedBy: null,
      displayName: { ar: 'الصفحة الرئيسية', en: 'Home' },
      sections: [],
    };
  },

  async saveRecord(input: PageRecord): Promise<PageRecord> {
    const parsed = pageRecordSchema.safeParse(withoutRetiredSections(input));
    if (!parsed.success) {
      const error: PageSaveError = {
        code: 'VALIDATION_FAILED',
        message: 'Invalid page record',
        issues: parsed.error.flatten(),
      };
      throw error;
    }

    if (!isStoreHttpEnabled()) {
      throw new Error('STORE_HTTP_DISABLED');
    }
    if (parsed.data.pageType !== 'homepage') {
      throw new Error('ONLY_HOMEPAGE_SUPPORTED');
    }

    return withoutRetiredSections(await saveAdminHomepage(parsed.data as PageRecord));
  },
};
