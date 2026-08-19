'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, CircleHelp, Pencil, Plus, Save, Trash2 } from 'lucide-react';
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
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const FAQ_QUERY_KEY = ['ecommerce-cms', 'content', 'faq'] as const;

function emptyItem(): FaqItem {
  return {
    id: crypto.randomUUID(),
    question: { ar: '', en: '' },
    answer: { ar: '', en: '' },
  };
}

function normalizeItem(item: FaqItem): FaqItem {
  const question = item.question.ar.trim();
  const answer = item.answer.ar.trim();
  return {
    ...item,
    question: { ar: question, en: question },
    answer: { ar: answer, en: answer },
  };
}

type ItemFormState = {
  open: boolean;
  index: number | null;
  draft: FaqItem;
};

export function FaqCmsPage({ embedded = false }: { embedded?: boolean }) {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.faq');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...FAQ_QUERY_KEY, companyId],
    queryFn: async () => {
      const bundle = await getCmsContentBundle(companyId);
      return bundle?.faq ?? [];
    },
  });

  const [draft, setDraft] = React.useState<FaqItem[] | null>(null);
  const [search, setSearch] = React.useState('');
  const [form, setForm] = React.useState<ItemFormState | null>(null);
  const [toDeleteIndex, setToDeleteIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (faq: FaqItem[]) => saveCmsFaq(companyId, faq.map(normalizeItem)),
    onSuccess: (saved) => {
      queryClient.setQueryData([...FAQ_QUERY_KEY, companyId], saved);
      setDraft(saved);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  const items = draft ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!normalizedSearch) return true;
    return (
      item.question.ar.toLowerCase().includes(normalizedSearch) ||
      item.answer.ar.toLowerCase().includes(normalizedSearch)
    );
  });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <Button
          type="button"
          size="sm"
          className="h-8"
          disabled={!draft}
          onClick={() =>
            setForm({
              open: true,
              index: null,
              draft: emptyItem(),
            })
          }
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

  function moveItem(index: number, direction: -1 | 1) {
    if (!draft) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= draft.length) return;
    const next = [...draft];
    const current = next[index];
    const swap = next[swapIndex];
    if (!current || !swap) return;
    next[index] = swap;
    next[swapIndex] = current;
    setDraft(next);
  }

  function saveItemForm() {
    if (!form || !draft) return;
    const nextItem = normalizeItem(form.draft);
    if (!nextItem.question.ar.trim()) return;
    if (form.index === null) {
      setDraft([...draft, nextItem]);
    } else {
      const next = [...draft];
      next[form.index] = nextItem;
      setDraft(next);
    }
    setForm(null);
  }

  function confirmDelete() {
    if (toDeleteIndex === null || !draft) return;
    setDraft(draft.filter((_, i) => i !== toDeleteIndex));
    setToDeleteIndex(null);
  }

  const columns: ColumnDef<FaqItem>[] = [
    {
      key: 'question',
      title: t('columnQuestion'),
      render: (item) => (
        <span className="line-clamp-2 text-sm font-medium text-foreground">
          {item.question.ar.trim() || t('noQuestion')}
        </span>
      ),
    },
    {
      key: 'answer',
      title: t('columnAnswer'),
      render: (item) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {item.answer.ar.trim() || t('noAnswer')}
        </span>
      ),
    },
    {
      key: 'order',
      title: t('columnOrder'),
      render: (item) => {
        const index = items.findIndex((row) => row.id === item.id);
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index <= 0}
              onClick={() => moveItem(index, -1)}
              aria-label={t('moveUp')}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center tabular-nums text-xs text-muted-foreground">
              {index + 1}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index < 0 || index >= items.length - 1}
              onClick={() => moveItem(index, 1)}
              aria-label={t('moveDown')}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (item) => {
        const index = items.findIndex((row) => row.id === item.id);
        return (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tCommon('actions.edit')}
              onClick={() =>
                setForm({
                  open: true,
                  index,
                  draft: structuredClone(item),
                })
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tCommon('actions.delete')}
              onClick={() => setToDeleteIndex(index)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="CircleHelp" /> : null}

      {draft ? (
        <StatTileGrid className="sm:grid-cols-2">
          <StatTile icon={CircleHelp} label={t('title')} value={draft.length} tone="primary" />
        </StatTileGrid>
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

      <DataTable
        variant="directory"
        className="sto-table-host"
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        loading={isLoading}
        emptyText={t('empty')}
      />

      <Dialog
        open={Boolean(form?.open)}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form?.index === null ? t('addItem') : t('editItem')}
            </DialogTitle>
          </DialogHeader>

          {form ? (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="faq-question">{t('question')}</Label>
                <Input
                  id="faq-question"
                  value={form.draft.question.ar}
                  placeholder={t('questionPlaceholder')}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm({
                      ...form,
                      draft: {
                        ...form.draft,
                        question: { ar: value, en: value },
                      },
                    });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-answer">{t('answer')}</Label>
                <Textarea
                  id="faq-answer"
                  rows={5}
                  value={form.draft.answer.ar}
                  placeholder={t('answerPlaceholder')}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm({
                      ...form,
                      draft: {
                        ...form.draft,
                        answer: { ar: value, en: value },
                      },
                    });
                  }}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!form?.draft.question.ar.trim()}
              onClick={saveItemForm}
            >
              {tCommon('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={toDeleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setToDeleteIndex(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('removeItemTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('removeItemDescription')}</p>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setToDeleteIndex(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              {tCommon('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
