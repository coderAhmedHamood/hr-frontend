/** CMS page kinds — homepage is the first consumer; engine supports all. */
export const PAGE_TYPES = [
  'homepage',
  'category-landing',
  'brand-page',
  'campaign',
  'offer',
  'custom',
] as const;

export type PageType = (typeof PAGE_TYPES)[number];

export const PAGE_STATUSES = ['draft', 'published', 'archived'] as const;

export type PageStatus = (typeof PAGE_STATUSES)[number];

export const SECTION_STATUSES = ['draft', 'published', 'archived'] as const;

export type SectionStatus = (typeof SECTION_STATUSES)[number];
