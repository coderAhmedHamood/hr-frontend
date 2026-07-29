'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getCmsCompanyRecord, saveCmsCompanyRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import { NavigationFooterPanel } from '@/features/ecommerce/admin/cms/navigation/components/navigation-footer-panel';
import { NavigationAnnouncementPanel } from '@/features/ecommerce/admin/cms/navigation/components/navigation-announcement-panel';
import type { EcommerceNavigationTab } from '@/features/ecommerce/admin/constants/routes';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const NAV_QUERY_KEY = ['ecommerce-cms', 'company', 'navigation'] as const;
const NAV_TABS: EcommerceNavigationTab[] = ['footer', 'announcement'];

function resolveNavigationTab(value: string | null): EcommerceNavigationTab {
  if (value && NAV_TABS.includes(value as EcommerceNavigationTab)) {
    return value as EcommerceNavigationTab;
  }
  return 'footer';
}

/**
 * Appearance domain — Footer and Announcement.
 * Active panel is deep-linked via `?tab=` from Website → Appearance nav items
 * (no in-page tab bar — switch from the top nav).
 */
export function NavigationBuilderPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.navigation');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tab = resolveNavigationTab(searchParams.get('tab'));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...NAV_QUERY_KEY, companyId],
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
      queryClient.setQueryData([...NAV_QUERY_KEY, companyId], saved);
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  usePageHeaderActions(
    () => (
      <PageHeaderPrimaryButton
        icon={Save}
        label={save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
        disabled={!draft || save.isPending}
        onClick={() => {
          if (draft) void save.mutateAsync(draft);
        }}
      />
    ),
    [draft, save.isPending, tCommon],
  );

  const titleKey = tab === 'announcement' ? 'tabs.announcement' : 'tabs.footer';

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t(titleKey)} descriptionAr={t('description')} iconName="Navigation" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : null}
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

      {draft && tab === 'footer' ? (
        <NavigationFooterPanel draft={draft} onChange={setDraft} />
      ) : null}
      {draft && tab === 'announcement' ? (
        <NavigationAnnouncementPanel draft={draft} onChange={setDraft} />
      ) : null}
    </div>
  );
}
