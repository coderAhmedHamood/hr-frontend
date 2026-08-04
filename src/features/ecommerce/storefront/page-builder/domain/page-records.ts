import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import type { PageMetadata } from '@/features/ecommerce/storefront/page-builder/domain/section-metadata';
import type { SectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';

/** CMS page document — JSON today; API DTO tomorrow. */
export type PageRecord = PageMetadata & {
  displayName: LocalizableString;
  sections: SectionRecord[];
};
