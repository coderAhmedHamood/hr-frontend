export const homepageCmsQueryKeys = {
  all: ['ecommerce-cms', 'homepage'] as const,
  record: (companyId: string) => [...homepageCmsQueryKeys.all, 'record', companyId] as const,
};
