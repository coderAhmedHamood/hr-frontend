import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type { StorefrontPage } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { PageType } from '@/features/ecommerce/storefront/page-builder/domain/page-types';
import type { PageCmsPort, PageStorefrontPort } from '@/features/ecommerce/storefront/page-builder/domain/page.ports';
import { mapStorefrontPage } from '@/features/ecommerce/storefront/page-builder/lib/mappers/page-mapper';
import { mockRepositoryDelay } from '@/features/ecommerce/storefront/lib/repositories/mock-delay';
import { pageRecordSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
import homepagePageSeed from '@/features/ecommerce/storefront/page-builder/lib/mock/pages/homepage.json';
import type { StorefrontLocale } from '@/i18n/routing';

const PAGE_INDEX: Record<string, PageRecord> = {};

function pageKey(companyId: string, pageType: PageType): string {
  return `${companyId}:${pageType}`;
}

function slugKey(companyId: string, slug: string): string {
  return `${companyId}:slug:${slug}`;
}

function registerPage(raw: unknown): void {
  const parsed = pageRecordSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[page-repository] Invalid page record', parsed.error.flatten());
    }
    return;
  }
  const record = parsed.data as PageRecord;
  PAGE_INDEX[pageKey(record.companyId, record.pageType)] = record;
  PAGE_INDEX[slugKey(record.companyId, record.slug)] = record;
}

registerPage(homepagePageSeed);

function cloneRecord(record: PageRecord): PageRecord {
  return JSON.parse(JSON.stringify(record)) as PageRecord;
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
 * Implements PageStorefrontPort + PageCmsPort against one in-memory index.
 * Storefront methods expose published pages only; CMS methods read/write any status.
 */
export const storefrontPageRepository: PageStorefrontPort & PageCmsPort = {
  async getByPageType(
    companyId: string,
    pageType: PageType,
    locale: StorefrontLocale,
  ): Promise<StorefrontPage | null> {
    const record = PAGE_INDEX[pageKey(companyId, pageType)] ?? null;
    if (!record || !isPubliclyVisible(record)) return null;
    return mockRepositoryDelay(mapStorefrontPage(record, locale));
  },

  async getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontPage | null> {
    const record = PAGE_INDEX[slugKey(companyId, slug)] ?? null;
    if (!record || !isPubliclyVisible(record)) return null;
    return mockRepositoryDelay(mapStorefrontPage(record, locale));
  },

  /** Admin / CMS — raw bilingual page document (no locale resolution). */
  async getRecordByPageType(companyId: string, pageType: PageType): Promise<PageRecord | null> {
    const record = PAGE_INDEX[pageKey(companyId, pageType)] ?? null;
    return mockRepositoryDelay(record ? cloneRecord(record) : null);
  },

  /**
   * Persists a full page document after Zod validation.
   * Updates the same in-memory index the storefront reads.
   * Draft / archived saves stay invisible to storefront get* until published.
   */
  async saveRecord(input: PageRecord): Promise<PageRecord> {
    const parsed = pageRecordSchema.safeParse(input);
    if (!parsed.success) {
      const error: PageSaveError = {
        code: 'VALIDATION_FAILED',
        message: 'Invalid page record',
        issues: parsed.error.flatten(),
      };
      throw error;
    }

    const now = new Date().toISOString();
    const previous = PAGE_INDEX[pageKey(parsed.data.companyId, parsed.data.pageType)];
    if (previous && previous.slug !== parsed.data.slug) {
      delete PAGE_INDEX[slugKey(previous.companyId, previous.slug)];
    }

    const next = {
      ...parsed.data,
      contentVersion: (previous?.contentVersion ?? parsed.data.contentVersion) + 1,
      updatedAt: now,
      publishedAt:
        parsed.data.status === 'published'
          ? (parsed.data.publishedAt ?? now)
          : parsed.data.publishedAt,
    } as PageRecord;

    PAGE_INDEX[pageKey(next.companyId, next.pageType)] = next;
    PAGE_INDEX[slugKey(next.companyId, next.slug)] = next;
    return mockRepositoryDelay(cloneRecord(next));
  },
};
