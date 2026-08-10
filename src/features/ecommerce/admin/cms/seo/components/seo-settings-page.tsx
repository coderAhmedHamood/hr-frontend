'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontCompanyRepository } from '@/features/ecommerce/storefront/lib/repositories/company-repository';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SEO_QUERY_KEY = ['ecommerce-cms', 'company', 'seo'] as const;

export function SeoSettingsPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.seo');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...SEO_QUERY_KEY, companyId],
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
      queryClient.setQueryData([...SEO_QUERY_KEY, companyId], saved);
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  function patchSeo(path: keyof CompanyConfigRecord['seo'], locale: 'ar' | 'en', value: string) {
    if (!draft) return;
    const field = draft.seo[path];
    if (typeof field === 'string' || field === undefined) {
      if (path === 'defaultOgImage') {
        setDraft({ ...draft, seo: { ...draft.seo, defaultOgImage: value } });
      }
      return;
    }
    setDraft({
      ...draft,
      seo: {
        ...draft.seo,
        [path]: { ...field, [locale]: value },
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle titleAr={t('title')} iconName="Search" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-arabic-display text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button type="button" disabled={!draft || save.isPending} onClick={() => draft && void save.mutateAsync(draft)}>
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

      {draft ? (
        <Card>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
            {(
              [
                ['homeTitle', 'homeTitleAr', 'homeTitleEn'],
                ['homeDescription', 'homeDescriptionAr', 'homeDescriptionEn'],
                ['productsTitle', 'productsTitleAr', 'productsTitleEn'],
                ['productsDescription', 'productsDescriptionAr', 'productsDescriptionEn'],
              ] as const
            ).map(([key, arKey, enKey]) => {
              const value = draft.seo[key];
              const Field = key.includes('Description') ? Textarea : Input;
              return (
                <React.Fragment key={key}>
                  <div className="space-y-1.5">
                    <Label>{t(arKey)}</Label>
                    <Field
                      value={typeof value === 'object' ? value.ar : ''}
                      onChange={(event) => patchSeo(key, 'ar', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t(enKey)}</Label>
                    <Field
                      value={typeof value === 'object' ? value.en : ''}
                      onChange={(event) => patchSeo(key, 'en', event.target.value)}
                    />
                  </div>
                </React.Fragment>
              );
            })}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t('defaultOgImage')}</Label>
              <Input
                value={draft.seo.defaultOgImage ?? ''}
                onChange={(event) =>
                  setDraft({ ...draft, seo: { ...draft.seo, defaultOgImage: event.target.value } })
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
