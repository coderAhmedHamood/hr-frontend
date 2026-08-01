'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import type {
  CompanyAnnouncementBarRecord,
  CompanyAnnouncementItemRecord,
  CompanyConfigRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import {
  clampAnnouncementSpeedMs,
  normalizeAnnouncementBar,
} from '@/features/ecommerce/storefront/domain/company-config';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

function defaultAnnouncement(): CompanyAnnouncementBarRecord {
  return normalizeAnnouncementBar({
    enabled: false,
    dismissible: true,
    items: [],
  });
}

function createEmptyItem(): CompanyAnnouncementItemRecord {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    message: { ar: '', en: '' },
    href: null,
  };
}

function itemLabel(item: CompanyAnnouncementItemRecord): string {
  return item.message.ar.trim() || item.message.en.trim();
}

type ItemFormState = {
  index: number | null;
  draft: CompanyAnnouncementItemRecord;
};

type Props = {
  draft: CompanyConfigRecord;
  onChange: (next: CompanyConfigRecord) => void;
};

export function NavigationAnnouncementPanel({ draft, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.navigation.announcement');
  const tCommon = useTranslations('common');
  const announcement = normalizeAnnouncementBar(draft.announcement ?? defaultAnnouncement());
  const items = announcement.items;
  const [form, setForm] = React.useState<ItemFormState | null>(null);

  function updateBar(patch: Partial<CompanyAnnouncementBarRecord>) {
    onChange({
      ...draft,
      announcement: { ...announcement, ...patch },
    });
  }

  function updateItems(nextItems: CompanyAnnouncementItemRecord[]) {
    updateBar({ items: nextItems });
  }

  function setItemEnabled(index: number, enabled: boolean) {
    const next = [...items];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, enabled };
    updateItems(next);
  }

  function moveItem(index: number, direction: -1 | 1) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const next = [...items];
    const current = next[index];
    const swap = next[swapIndex];
    if (!current || !swap) return;
    next[index] = swap;
    next[swapIndex] = current;
    updateItems(next);
  }

  function removeItem(index: number) {
    updateItems(items.filter((_, i) => i !== index));
  }

  function saveItemForm() {
    if (!form) return;
    const nextItem: CompanyAnnouncementItemRecord = {
      ...form.draft,
      message: {
        ar: form.draft.message.ar.trim(),
        en: form.draft.message.en.trim(),
      },
      href: form.draft.href?.trim()
        ? (form.draft.href.trim() as CompanyAnnouncementItemRecord['href'])
        : null,
    };
    if (!itemLabel(nextItem)) return;

    if (form.index === null) {
      updateItems([...items, nextItem]);
    } else {
      const next = [...items];
      next[form.index] = nextItem;
      updateItems(next);
    }
    setForm(null);
  }

  const previewMessages = items
    .filter((item) => item.enabled && itemLabel(item))
    .map((item) => item.message.ar.trim() || item.message.en.trim());

  const columns: ColumnDef<CompanyAnnouncementItemRecord>[] = [
    {
      key: 'message',
      title: t('columnMessage'),
      render: (item) => (
        <span
          className={`line-clamp-2 text-sm font-medium ${
            item.enabled ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {itemLabel(item) || t('emptyMessage')}
        </span>
      ),
    },
    {
      key: 'status',
      title: t('columnStatus'),
      render: (item) => {
        const index = items.findIndex((row) => row.id === item.id);
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item.enabled}
              onCheckedChange={(enabled) => setItemEnabled(index, enabled)}
              aria-label={item.enabled ? t('enabled') : t('disabled')}
            />
            <span className="text-xs text-muted-foreground">
              {item.enabled ? t('enabled') : t('disabled')}
            </span>
          </div>
        );
      },
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
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={index <= 0}
              onClick={() => moveItem(index, -1)}
              aria-label={t('moveUp')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={index >= items.length - 1}
              onClick={() => moveItem(index, 1)}
              aria-label={t('moveDown')}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: t('columnActions'),
      render: (item) => {
        const index = items.findIndex((row) => row.id === item.id);
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setForm({ index, draft: structuredClone(item) })}
              aria-label={tCommon('actions.edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeItem(index)}
              aria-label={tCommon('actions.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="mb-5 flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Label htmlFor="announcement-enabled" className="text-xs text-muted-foreground">
              {announcement.enabled ? t('enabled') : t('disabled')}
            </Label>
            <Switch
              id="announcement-enabled"
              checked={announcement.enabled}
              onCheckedChange={(enabled) => updateBar({ enabled })}
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{t('itemsHint')}</p>
          <Button
            type="button"
            size="sm"
            onClick={() => setForm({ index: null, draft: createEmptyItem() })}
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('addItem')}
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('empty')}
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(item) => item.id}
            emptyText={t('empty')}
            alwaysShowTable
          />
        )}

        <p className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          {t('speedInSettings')}{' '}
          <Link href={ecommerceAdminRoutes.settings} className="font-medium text-primary hover:underline">
            {t('openSettings')}
          </Link>
        </p>
      </section>

      {announcement.enabled && previewMessages.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <p className="border-b border-border/50 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
            {t('preview')}
          </p>
          <AnnouncementMarqueePreview
            messages={previewMessages}
            speedMs={announcement.speedMs}
            scrolling={announcement.scrolling}
          />
        </div>
      ) : null}

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form?.index === null ? t('addItem') : t('editItem')}
            </DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="grid gap-4 py-1">
              <div className="space-y-1.5">
                <Label>{t('message')}</Label>
                <Textarea
                  rows={3}
                  value={form.draft.message.ar}
                  placeholder={t('messagePlaceholder')}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm({
                      ...form,
                      draft: {
                        ...form.draft,
                        message: { ar: value, en: value },
                      },
                    });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('href')}</Label>
                <Input
                  dir="ltr"
                  className="font-mono text-sm"
                  value={form.draft.href ?? ''}
                  placeholder="/store/offers"
                  onChange={(event) => {
                    const value = event.target.value.trim();
                    setForm({
                      ...form,
                      draft: {
                        ...form.draft,
                        href: value
                          ? (value as CompanyAnnouncementItemRecord['href'])
                          : null,
                      },
                    });
                  }}
                />
                <p className="text-[11px] text-muted-foreground">{t('hrefHint')}</p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">
                  {form.draft.enabled ? t('enabled') : t('disabled')}
                </p>
                <Switch
                  checked={form.draft.enabled}
                  onCheckedChange={(enabled) =>
                    setForm({ ...form, draft: { ...form.draft, enabled } })
                  }
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!form || !itemLabel(form.draft)}
              onClick={saveItemForm}
            >
              {tCommon('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnouncementMarqueePreview({
  messages,
  speedMs,
  scrolling,
}: {
  messages: string[];
  speedMs: number;
  scrolling: boolean;
}) {
  const display = scrolling ? [...messages, ...messages] : messages;
  const duration = `${clampAnnouncementSpeedMs(speedMs)}ms`;
  return (
    <div
      className={cn(
        'storefront-announcement-marquee bg-primary py-2.5 text-primary-foreground',
        !scrolling && 'storefront-announcement-marquee--static',
      )}
    >
      <div
        className="storefront-announcement-marquee__track"
        style={
          scrolling
            ? { ['--announcement-marquee-duration' as string]: duration }
            : undefined
        }
      >
        {display.map((message, index) => (
          <React.Fragment key={`${message}-${index}`}>
            {index > 0 ? (
              <span className="storefront-announcement-marquee__sep" aria-hidden>
                •
              </span>
            ) : null}
            <span className="storefront-announcement-marquee__item text-sm font-medium">
              {message}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
