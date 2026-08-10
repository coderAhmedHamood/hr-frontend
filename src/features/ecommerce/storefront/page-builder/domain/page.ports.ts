/**
 * Dual-port contracts for CMS page documents.
 * Record (CMS) vs StorefrontPage (public). Draft/archived pages are CMS-only.
 */
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type { StorefrontPage } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { PageType } from '@/features/ecommerce/storefront/page-builder/domain/page-types';
import type { StorefrontLocale } from '@/i18n/routing';

export type PageStorefrontPort = {
  getByPageType(
    companyId: string,
    pageType: PageType,
    locale: StorefrontLocale,
  ): Promise<StorefrontPage | null>;
  getBySlug(companyId: string, slug: string, locale: StorefrontLocale): Promise<StorefrontPage | null>;
};

export type PageCmsPort = {
  getRecordByPageType(companyId: string, pageType: PageType): Promise<PageRecord | null>;
  saveRecord(input: PageRecord): Promise<PageRecord>;
};
