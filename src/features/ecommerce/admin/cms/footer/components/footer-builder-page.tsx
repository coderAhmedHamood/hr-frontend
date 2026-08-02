'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontCompanyRepository } from '@/features/ecommerce/storefront/lib/repositories/company-repository';
import type {
  CompanyConfigRecord,
  CompanyFooterLinkGroupRecord,
  CompanyNavItemRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FOOTER_QUERY_KEY = ['ecommerce-cms', 'company', 'footer'] as const;

function emptyLink(): CompanyNavItemRecord {
  return { label: { ar: '', en: '' }, href: '/store' };
}

function emptyGroup(): CompanyFooterLinkGroupRecord {
  return {
    id: crypto.randomUUID(),
    title: { ar: '', en: '' },
    links: [emptyLink()],
  };
}

export function FooterBuilderPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.footer');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...FOOTER_QUERY_KEY, companyId],
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
      queryClient.setQueryData([...FOOTER_QUERY_KEY, companyId], saved);
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  function updateFooter(patch: Partial<CompanyConfigRecord['footer']>) {
    if (!draft) return;
    setDraft({ ...draft, footer: { ...draft.footer, ...patch } });
  }

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

      {draft ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('copyrightOwner')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('copyrightAr')}</Label>
                <Input
                  value={draft.footer.copyrightOwnerName.ar}
                  onChange={(event) =>
                    updateFooter({
                      copyrightOwnerName: { ...draft.footer.copyrightOwnerName, ar: event.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('copyrightEn')}</Label>
                <Input
                  value={draft.footer.copyrightOwnerName.en}
                  onChange={(event) =>
                    updateFooter({
                      copyrightOwnerName: { ...draft.footer.copyrightOwnerName, en: event.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{t('linkGroups')}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => updateFooter({ linkGroups: [...draft.footer.linkGroups, emptyGroup()] })}
              >
                <Plus className="me-2 h-4 w-4" />
                {t('addGroup')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.footer.linkGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('empty')}</p>
              ) : null}
              {draft.footer.linkGroups.map((group, groupIndex) => (
                <div key={group.id} className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateFooter({
                          linkGroups: draft.footer.linkGroups.filter((_, i) => i !== groupIndex),
                        })
                      }
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('removeGroup')}
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t('groupTitleAr')}</Label>
                      <Input
                        value={group.title.ar}
                        onChange={(event) => {
                          const linkGroups = [...draft.footer.linkGroups];
                          linkGroups[groupIndex] = {
                            ...group,
                            title: { ...group.title, ar: event.target.value },
                          };
                          updateFooter({ linkGroups });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('groupTitleEn')}</Label>
                      <Input
                        value={group.title.en}
                        onChange={(event) => {
                          const linkGroups = [...draft.footer.linkGroups];
                          linkGroups[groupIndex] = {
                            ...group,
                            title: { ...group.title, en: event.target.value },
                          };
                          updateFooter({ linkGroups });
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const linkGroups = [...draft.footer.linkGroups];
                        linkGroups[groupIndex] = {
                          ...group,
                          links: [...group.links, emptyLink()],
                        };
                        updateFooter({ linkGroups });
                      }}
                    >
                      <Plus className="me-2 h-4 w-4" />
                      {t('addLink')}
                    </Button>
                  </div>

                  {group.links.map((link, linkIndex) => (
                    <div key={`${group.id}-${linkIndex}`} className="space-y-2 rounded-md border border-border/70 p-3">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const linkGroups = [...draft.footer.linkGroups];
                            linkGroups[groupIndex] = {
                              ...group,
                              links: group.links.filter((_, i) => i !== linkIndex),
                            };
                            updateFooter({ linkGroups });
                          }}
                        >
                          {t('removeLink')}
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={link.label.ar}
                          onChange={(event) => {
                            const linkGroups = [...draft.footer.linkGroups];
                            const links = [...group.links];
                            links[linkIndex] = {
                              ...link,
                              label: { ...link.label, ar: event.target.value },
                            };
                            linkGroups[groupIndex] = { ...group, links };
                            updateFooter({ linkGroups });
                          }}
                          aria-label={t('groupTitleAr')}
                        />
                        <Input
                          value={link.label.en}
                          onChange={(event) => {
                            const linkGroups = [...draft.footer.linkGroups];
                            const links = [...group.links];
                            links[linkIndex] = {
                              ...link,
                              label: { ...link.label, en: event.target.value },
                            };
                            linkGroups[groupIndex] = { ...group, links };
                            updateFooter({ linkGroups });
                          }}
                          aria-label={t('groupTitleEn')}
                        />
                      </div>
                      <Input
                        value={link.href}
                        onChange={(event) => {
                          const linkGroups = [...draft.footer.linkGroups];
                          const links = [...group.links];
                          links[linkIndex] = {
                            ...link,
                            href: event.target.value as CompanyNavItemRecord['href'],
                          };
                          linkGroups[groupIndex] = { ...group, links };
                          updateFooter({ linkGroups });
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
