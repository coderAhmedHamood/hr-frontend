'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { CircleHelp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontContentRepository } from '@/features/ecommerce/storefront/lib/repositories/content-repository';
import type { FaqItem } from '@/features/ecommerce/storefront/domain/content';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const FAQ_QUERY_KEY = ['ecommerce-cms', 'content', 'faq'] as const;

function emptyItem(): FaqItem {
  return {
    id: crypto.randomUUID(),
    question: { ar: '', en: '' },
    answer: { ar: '', en: '' },
  };
}

export function FaqCmsPage({ embedded = false }: { embedded?: boolean }) {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.faq');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...FAQ_QUERY_KEY, companyId],
    queryFn: async () => {
      const bundle = await storefrontContentRepository.getContentBundle(companyId);
      if (!bundle) throw new Error('CONTENT_NOT_FOUND');
      return bundle.faq;
    },
  });

  const [draft, setDraft] = React.useState<FaqItem[] | null>(null);
  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (faq: FaqItem[]) => storefrontContentRepository.saveFaq(companyId, faq),
    onSuccess: (saved) => {
      queryClient.setQueryData([...FAQ_QUERY_KEY, companyId], saved);
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? (
        <>
          <SetPageTitle titleAr={t('title')} iconName="CircleHelp" />

      <div className="flex flex-wrap justify-end gap-2">
        <>
                <Button type="button" variant="outline" onClick={() => setDraft([...(draft ?? []), emptyItem()])}>
                  <Plus className="me-2 h-4 w-4" />
                  {t('addItem')}
                </Button>
                <Button type="button" disabled={!draft || save.isPending} onClick={() => draft && void save.mutateAsync(draft)}>
                  {save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
                </Button>
              </>
      </div>
        </>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDraft([...(draft ?? []), emptyItem()])}>
            <Plus className="me-2 h-4 w-4" />
            {t('addItem')}
          </Button>
          <Button type="button" disabled={!draft || save.isPending} onClick={() => draft && void save.mutateAsync(draft)}>
            {save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

      {draft && draft.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <CircleHelp className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {(draft ?? []).map((item, index) => (
          <li key={item.id}>
            <Card className="transition-shadow hover:shadow-elevated">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground/70">
                    {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setDraft(draft!.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {t('removeItem')}
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('questionAr')}</Label>
                    <Input
                      value={item.question.ar}
                      onChange={(event) => {
                        const next = [...draft!];
                        next[index] = {
                          ...item,
                          question: { ...item.question, ar: event.target.value },
                        };
                        setDraft(next);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('questionEn')}</Label>
                    <Input
                      value={item.question.en}
                      onChange={(event) => {
                        const next = [...draft!];
                        next[index] = {
                          ...item,
                          question: { ...item.question, en: event.target.value },
                        };
                        setDraft(next);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('answerAr')}</Label>
                    <Textarea
                      value={item.answer.ar}
                      onChange={(event) => {
                        const next = [...draft!];
                        next[index] = {
                          ...item,
                          answer: { ...item.answer, ar: event.target.value },
                        };
                        setDraft(next);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('answerEn')}</Label>
                    <Textarea
                      value={item.answer.en}
                      onChange={(event) => {
                        const next = [...draft!];
                        next[index] = {
                          ...item,
                          answer: { ...item.answer, en: event.target.value },
                        };
                        setDraft(next);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
