export const STOREFRONT_KEYS = {
  all: ['storefront'] as const,
  search: (companyId: string, locale: string, query: string) =>
    ['storefront', 'search', companyId, locale, query] as const,
} as const;
