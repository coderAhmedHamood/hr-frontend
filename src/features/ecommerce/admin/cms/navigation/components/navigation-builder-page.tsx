'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Megaphone, PanelBottom, PanelTop, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getCmsCompanyRecord, saveCmsCompanyRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import type {
  CompanyConfigRecord,
  CompanyNavItemRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { NavigationFooterPanel } from '@/features/ecommerce/admin/cms/navigation/components/navigation-footer-panel';
import { NavigationAnnouncementPanel } from '@/features/ecommerce/admin/cms/navigation/components/navigation-announcement-panel';
import type { EcommerceNavigationTab } from '@/features/ecommerce/admin/constants/routes';
import { ecommerceNavigationHref } from '@/features/ecommerce/admin/constants/routes';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NAV_QUERY_KEY = ['ecommerce-cms', 'company', 'navigation'] as const;
const NAV_TABS: EcommerceNavigationTab[] = ['header', 'footer', 'announcement'];

function resolveNavigationTab(value: string | null): EcommerceNavigationTab {
  if (value && NAV_TABS.includes(value as EcommerceNavigationTab)) {
    return value as EcommerceNavigationTab;
  }
  return 'header';
}

function emptyNavItem(): CompanyNavItemRecord {
  return { label: { ar: '', en: '' }, href: '/store' };
}

export function NavigationBuilderPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.navigation');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const router = useRouter();
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

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="Navigation" />

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

      {draft ? (
        <Tabs
          value={tab}
          onValueChange={(value) => {
            router.replace(ecommerceNavigationHref(resolveNavigationTab(value)));
          }}
          className="w-full"
        >
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="header" className="gap-1.5">
              <PanelTop className="h-3.5 w-3.5" />
              {t('tabs.header')}
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-1.5">
              <PanelBottom className="h-3.5 w-3.5" />
              {t('tabs.footer')}
            </TabsTrigger>
            <TabsTrigger value="announcement" className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              {t('tabs.announcement')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="mt-4 space-y-5">
            <NavListEditor
              title={t('primary')}
              items={draft.navigation}
              emptyLabel={t('empty')}
              onChange={(navigation) => setDraft({ ...draft, navigation })}
              labels={{
                add: t('addItem'),
                remove: t('removeItem'),
                labelAr: t('labelAr'),
                labelEn: t('labelEn'),
                href: t('href'),
              }}
            />
          </TabsContent>

          <TabsContent value="footer" className="mt-4">
            <NavigationFooterPanel draft={draft} onChange={setDraft} />
          </TabsContent>

          <TabsContent value="announcement" className="mt-4">
            <NavigationAnnouncementPanel draft={draft} onChange={setDraft} />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

function NavListEditor({
  title,
  items,
  emptyLabel,
  onChange,
  labels,
}: {
  title: string;
  items: CompanyNavItemRecord[];
  emptyLabel: string;
  onChange: (items: CompanyNavItemRecord[]) => void;
  labels: { add: string; remove: string; labelAr: string; labelEn: string; href: string };
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, emptyNavItem()])}>
          <Plus className="me-2 h-4 w-4" />
          {labels.add}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : null}
        {items.map((item, index) => (
          <div
            key={`${item.href}-${index}`}
            className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {labels.remove}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{labels.labelAr}</Label>
                <Input
                  value={item.label.ar}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { ...item, label: { ...item.label, ar: event.target.value } };
                    onChange(next);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{labels.labelEn}</Label>
                <Input
                  value={item.label.en}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { ...item, label: { ...item.label, en: event.target.value } };
                    onChange(next);
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{labels.href}</Label>
              <Input
                value={item.href}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = {
                    ...item,
                    href: event.target.value as CompanyNavItemRecord['href'],
                  };
                  onChange(next);
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
