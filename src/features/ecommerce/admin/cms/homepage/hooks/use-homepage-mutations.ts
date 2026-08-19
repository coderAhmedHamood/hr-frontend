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
      // Prefer the save response — do not immediately refetch (refetch can briefly
      // fall back to the seed mock and wipe the just-saved hero slides).
      queryClient.setQueryData(homepageCmsQueryKeys.record(companyId), saved);
      toast.success(t('saveSuccess'));
    },
    onError: (error) => {
      const message = error instanceof Error && error.message.trim() ? error.message : t('saveError');
      toast.error(message);
    },
  });

  return { save };
}
