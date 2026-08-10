'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Navigation as NavigationIcon, Megaphone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontCompanyRepository } from '@/features/ecommerce/storefront/lib/repositories/company-repository';
import type {
  CompanyConfigRecord,
  CompanyNavItemRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { NavigationFooterPanel } from '@/features/ecommerce/admin/cms/navigation/components/navigation-footer-panel';
import type { EcommerceNavigationTab } from '@/features/ecommerce/admin/constants/routes';
import { ecommerceNavigationHref } from '@/features/ecommerce/admin/constants/routes';
import { SetPageTitle } from '@/components/layouts/set-page-title';
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
      const record = await storefrontCompanyRepository.getRecordByCompanyId(companyId);
      if (!record) throw new Error('COMPANY_NOT_FOUND');
      return record;
    },
  });

  const [draft, setDraft] = React.useState<CompanyConfigRecord | null>(null);

  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (record: CompanyConfigRecord) => storefrontCompanyRepository.saveRecord(record),
    onSuccess: (saved) => {
      queryClient.setQueryData([...NAV_QUERY_KEY, companyId], saved);
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} iconName="Navigation" />

      <div className="flex flex-wrap justify-end gap-2">
        <Button
            type="button"
            disabled={!draft || save.isPending || tab === 'announcement'}
            onClick={() => {
              if (draft) void save.mutateAsync(draft);
            }}
          >
            {save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
          </Button>
      </div>


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
            <TabsTrigger value="header">{t('tabs.header')}</TabsTrigger>
            <TabsTrigger value="footer">{t('tabs.footer')}</TabsTrigger>
            <TabsTrigger value="announcement">{t('tabs.announcement')}</TabsTrigger>
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
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary">
                  <Megaphone className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{t('announcement.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('announcement.description')}</p>
              </CardContent>
            </Card>
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
    <Card>
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
