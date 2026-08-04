import { useQuery } from '@tanstack/react-query';
import { getCmsPageRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import { homepageCmsQueryKeys } from '@/features/ecommerce/admin/cms/homepage/hooks/query-keys';

type UseHomepageOptions = {
  /** When false, missing/forbidden homepage returns null instead of throwing. */
  required?: boolean;
};

export function useHomepagePageRecord(companyId: string, options?: UseHomepageOptions) {
  const required = options?.required !== false;

  return useQuery({
    queryKey: [...homepageCmsQueryKeys.record(companyId), { required }],
    queryFn: async () => {
      const record = await getCmsPageRecord(companyId, 'homepage');
      if (!record) {
        if (!required) return null;
        throw new Error('HOMEPAGE_NOT_FOUND');
      }
      return record;
    },
    enabled: Boolean(companyId),
  });
}
