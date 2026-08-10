import type { PageStatus, PageType, SectionStatus } from '@/features/ecommerce/storefront/page-builder/domain/page-types';

/** Enterprise CMS metadata — static in JSON today; persisted by backend later. */
export type SectionMetadata = {
  id: string;
  status: SectionStatus;
  enabled: boolean;
  order: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type PageMetadata = {
  id: string;
  companyId: string;
  pageType: PageType;
  slug: string;
  schemaVersion: number;
  contentVersion: number;
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};
