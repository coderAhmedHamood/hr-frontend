'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getCmsCompanyRecord, saveCmsCompanyRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import { NavigationFooterPanel } from '@/features/ecommerce/admin/cms/navigation/components/navigation-footer-panel';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FOOTER_QUERY_KEY = ['ecommerce-cms', 'company', 'footer'] as const;

export function FooterBuilderPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.footer');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...FOOTER_QUERY_KEY, companyId],
    queryFn: async () => {
      const record = await getCmsCompanyRecord(companyId);
      if (!record) throw new Error('COMPANY_NOT_FOUND');
      return record;
    },
  });

  const [draft, setDraft] = React.useState<CompanyConfigRecord | null>(null);

  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (record: CompanyConfigRecord) => saveCmsCompanyRecord(record),
    onSuccess: (saved) => {
      queryClient.setQueryData([...FOOTER_QUERY_KEY, companyId], saved);
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle titleAr={t('title')} iconName="PanelBottom" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-arabic-display text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          type="button"
          disabled={!draft || save.isPending}
          onClick={() => {
            if (draft) void save.mutateAsync(draft);
          }}
        >
          {save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">{tCommon('status.loading')}</p> : null}
      {isError ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-6">
            <p className="text-sm text-destructive">{t('loadError')}</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              {tCommon('actions.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {draft ? <NavigationFooterPanel draft={draft} onChange={setDraft} /> : null}
    </div>
  );
}
