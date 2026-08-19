'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getCmsCompanyRecord, saveCmsCompanyRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import { FooterLinkGroupsEditor } from '@/features/ecommerce/admin/cms/footer/components/footer-link-groups-editor';
import { buildDefaultStoreFooterLinkGroups } from '@/features/ecommerce/storefront/lib/store-footer-defaults';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const FOOTER_QUERY_KEY = ['ecommerce-cms', 'company', 'footer'] as const;

export function FooterEditorPage() {
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
    if (!data) return;
    const next = structuredClone(data);
    if (!next.footer.linkGroups.some((group) => group.links.some((link) => link.href))) {
      next.footer.linkGroups = buildDefaultStoreFooterLinkGroups();
    }
    setDraft(next);
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
      <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="PanelBottom" />

      {isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-muted/40" /> : null}

      {isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4">
          <p className="text-sm text-destructive">{t('loadError')}</p>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void refetch()}>
            {tCommon('actions.retry')}
          </Button>
        </div>
      ) : null}

      {draft ? (
        <>
          <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('copyrightAr')}</Label>
                <Input
                  value={draft.footer.copyrightOwnerName.ar}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        copyrightOwnerName: {
                          ar: event.target.value,
                          en: event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('copyrightEn')}</Label>
                <Input
                  value={draft.footer.copyrightOwnerName.en}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        copyrightOwnerName: {
                          ...draft.footer.copyrightOwnerName,
                          en: event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('taglineAr')}</Label>
                <Textarea
                  rows={2}
                  value={draft.footer.tagline?.ar ?? ''}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        tagline: {
                          ar: event.target.value,
                          en: draft.footer.tagline?.en ?? event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('taglineEn')}</Label>
                <Textarea
                  rows={2}
                  value={draft.footer.tagline?.en ?? ''}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        tagline: {
                          ar: draft.footer.tagline?.ar ?? '',
                          en: event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">{t('linkGroups')}</h2>
            <FooterLinkGroupsEditor
              groups={draft.footer.linkGroups}
              onChange={(linkGroups) =>
                setDraft({
                  ...draft,
                  footer: { ...draft.footer, linkGroups },
                })
              }
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
