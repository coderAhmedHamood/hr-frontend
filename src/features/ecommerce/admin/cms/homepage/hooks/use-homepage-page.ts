import { useQuery } from '@tanstack/react-query';
import { storefrontPageRepository } from '@/features/ecommerce/storefront/page-builder/lib/repositories/page-repository';
import { homepageCmsQueryKeys } from '@/features/ecommerce/admin/cms/homepage/hooks/query-keys';

export function useHomepagePageRecord(companyId: string) {
  return useQuery({
    queryKey: homepageCmsQueryKeys.record(companyId),
    queryFn: async () => {
      const record = await storefrontPageRepository.getRecordByPageType(companyId, 'homepage');
      if (!record) {
        throw new Error('HOMEPAGE_NOT_FOUND');
      }
      return record;
    },
    enabled: Boolean(companyId),
  });
}
