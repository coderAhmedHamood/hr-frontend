'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { CircleHelp, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getCmsContentBundle, saveCmsFaq } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import type { FaqItem } from '@/features/ecommerce/storefront/domain/content';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatTile, StatTileGrid } from '@/components/ui/stat-tile';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';

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
      const bundle = await getCmsContentBundle(companyId);
      if (!bundle) throw new Error('CONTENT_NOT_FOUND');
      return bundle.faq;
    },
  });

  const [draft, setDraft] = React.useState<FaqItem[] | null>(null);
  const [search, setSearch] = React.useState('');
  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (faq: FaqItem[]) => saveCmsFaq(companyId, faq),
    onSuccess: (saved) => {
      queryClient.setQueryData([...FAQ_QUERY_KEY, companyId], saved);
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = (draft ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!normalizedSearch) return true;
      return (
        item.question.ar.toLowerCase().includes(normalizedSearch) ||
        item.question.en.toLowerCase().includes(normalizedSearch)
      );
    });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setDraft([...(draft ?? []), emptyItem()])}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('addItem')}</span>
        </Button>
        <PageHeaderPrimaryButton
          icon={Save}
          label={save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
          disabled={!draft || save.isPending}
          onClick={() => draft && void save.mutateAsync(draft)}
        />
      </div>
    ),
    [draft, save.isPending, t, tCommon],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField value={search} onChange={setSearch} placeholder={tCommon('actions.search')} />
        }
      />
    ),
    [search, tCommon],
  );

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="CircleHelp" /> : null}

      {draft ? (
        <StatTileGrid className="sm:grid-cols-2">
          <StatTile icon={CircleHelp} label={t('title')} value={draft.length} tone="primary" />
        </StatTileGrid>
      ) : null}

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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <CircleHelp className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
        </div>
      ) : null}

      {draft && draft.length > 0 && filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <CircleHelp className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {filteredItems.map(({ item, index }) => (
          <li key={item.id}>
            <Card className="rounded-2xl transition-shadow hover:shadow-elevated">
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
