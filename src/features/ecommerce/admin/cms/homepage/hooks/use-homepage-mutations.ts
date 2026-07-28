import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import { saveCmsPageRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import { homepageCmsQueryKeys } from '@/features/ecommerce/admin/cms/homepage/hooks/query-keys';

export function useHomepagePageMutations(companyId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('ecommerceAdmin.homepage');

  const save = useMutation({
    mutationFn: (record: PageRecord) => saveCmsPageRecord(record),
    onSuccess: (saved) => {
      queryClient.setQueryData(homepageCmsQueryKeys.record(companyId), saved);
      void queryClient.invalidateQueries({ queryKey: homepageCmsQueryKeys.all });
      toast.success(t('saveSuccess'));
    },
    onError: () => {
      toast.error(t('saveError'));
    },
  });

  return { save };
}
