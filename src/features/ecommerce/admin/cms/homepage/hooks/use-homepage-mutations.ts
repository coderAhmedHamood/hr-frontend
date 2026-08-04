import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import { storefrontPageRepository } from '@/features/ecommerce/storefront/page-builder/lib/repositories/page-repository';
import { homepageCmsQueryKeys } from '@/features/ecommerce/admin/cms/homepage/hooks/query-keys';

export function useHomepagePageMutations(companyId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('ecommerceAdmin.homepage');

  const save = useMutation({
    mutationFn: (record: PageRecord) => storefrontPageRepository.saveRecord(record),
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
