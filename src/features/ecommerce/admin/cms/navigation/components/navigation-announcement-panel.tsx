'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Megaphone } from 'lucide-react';
import type {
  CompanyAnnouncementBarRecord,
  CompanyConfigRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

function defaultAnnouncement(): CompanyAnnouncementBarRecord {
  return {
    enabled: false,
    message: { ar: '', en: '' },
    href: null,
    dismissible: true,
  };
}

type Props = {
  draft: CompanyConfigRecord;
  onChange: (next: CompanyConfigRecord) => void;
};

export function NavigationAnnouncementPanel({ draft, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.navigation.announcement');
  const announcement = draft.announcement ?? defaultAnnouncement();

  function update(patch: Partial<CompanyAnnouncementBarRecord>) {
    onChange({
      ...draft,
      announcement: { ...announcement, ...patch },
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="mb-5 flex items-start gap-3">
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
              onCheckedChange={(enabled) => update({ enabled })}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('messageAr')}</Label>
              <Textarea
                rows={3}
                value={announcement.message.ar}
                placeholder={t('messagePlaceholderAr')}
                onChange={(event) =>
                  update({ message: { ...announcement.message, ar: event.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('messageEn')}</Label>
              <Textarea
                rows={3}
                value={announcement.message.en}
                placeholder={t('messagePlaceholderEn')}
                onChange={(event) =>
                  update({ message: { ...announcement.message, en: event.target.value } })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('href')}</Label>
            <Input
              dir="ltr"
              className="font-mono text-sm"
              value={announcement.href ?? ''}
              placeholder="/store/offers"
              onChange={(event) => {
                const value = event.target.value.trim();
                update({
                  href: value
                    ? (value as CompanyAnnouncementBarRecord['href'])
                    : null,
                });
              }}
            />
            <p className="text-[11px] text-muted-foreground">{t('hrefHint')}</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">{t('dismissible')}</p>
              <p className="text-xs text-muted-foreground">{t('dismissibleHint')}</p>
            </div>
            <Switch
              checked={announcement.dismissible}
              onCheckedChange={(dismissible) => update({ dismissible })}
            />
          </div>
        </div>
      </section>

      {announcement.enabled && (announcement.message.ar.trim() || announcement.message.en.trim()) ? (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <p className="border-b border-border/50 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
            {t('preview')}
          </p>
          <div className="bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground">
            {announcement.message.ar.trim() || announcement.message.en}
          </div>
        </div>
      ) : null}
    </div>
  );
}
