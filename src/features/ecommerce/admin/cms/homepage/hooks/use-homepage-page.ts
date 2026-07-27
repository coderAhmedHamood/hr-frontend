import { useQuery } from '@tanstack/react-query';
import { getCmsPageRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import { homepageCmsQueryKeys } from '@/features/ecommerce/admin/cms/homepage/hooks/query-keys';

export function useHomepagePageRecord(companyId: string) {
  return useQuery({
    queryKey: homepageCmsQueryKeys.record(companyId),
    queryFn: async () => {
      const record = await getCmsPageRecord(companyId, 'homepage');
      if (!record) {
        throw new Error('HOMEPAGE_NOT_FOUND');
      }
      return record;
    },
    enabled: Boolean(companyId),
  });
}
