'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FolderOpen, Link2, Plus, Trash2 } from 'lucide-react';
import type {
  CompanyConfigRecord,
  CompanyFooterLinkGroupRecord,
  CompanyNavItemRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';

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

type Props = {
  draft: CompanyConfigRecord;
  onChange: (next: CompanyConfigRecord) => void;
};

/** Footer menus live under Navigation domain — CR is edited in Website Settings. */
export function NavigationFooterPanel({ draft, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.footer');

  function updateFooter(patch: Partial<CompanyConfigRecord['footer']>) {
    onChange({ ...draft, footer: { ...draft.footer, ...patch } });
  }

  function updateGroup(groupIndex: number, next: CompanyFooterLinkGroupRecord) {
    const linkGroups = [...draft.footer.linkGroups];
    linkGroups[groupIndex] = next;
    updateFooter({ linkGroups });
  }

  return (
    <div className="space-y-6">
      {/* Copyright — compact strip */}
      <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t('copyrightOwner')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('copyrightAr')}</Label>
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
            <Label className="text-xs text-muted-foreground">{t('copyrightEn')}</Label>
            <Input
              value={draft.footer.copyrightOwnerName.en}
              onChange={(event) =>
                updateFooter({
                  copyrightOwnerName: { ...draft.footer.copyrightOwnerName, en: event.target.value },
                })
              }
            />
          </div>
        </div>
      </section>

      {/* Link groups */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('linkGroups')}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('linkGroupsHint')}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 rounded-xl"
            onClick={() => updateFooter({ linkGroups: [...draft.footer.linkGroups, emptyGroup()] })}
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('addGroup')}
          </Button>
        </div>

        {draft.footer.linkGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/15 px-4 py-14 text-center">
            <FolderOpen className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {draft.footer.linkGroups.map((group, groupIndex) => (
              <FooterGroupCard
                key={group.id}
                group={group}
                groupIndex={groupIndex}
                labels={{
                  groupTitle: t('groupTitle'),
                  groupTitleAr: t('groupTitleAr'),
                  groupTitleEn: t('groupTitleEn'),
                  links: t('linksInGroup'),
                  linkLabelAr: t('linkLabelAr'),
                  linkLabelEn: t('linkLabelEn'),
                  linkHref: t('linkHref'),
                  addLink: t('addLink'),
                  removeGroup: t('removeGroup'),
                  removeLink: t('removeLink'),
                  emptyLinks: t('emptyLinks'),
                }}
                onChange={(next) => updateGroup(groupIndex, next)}
                onRemove={() =>
                  updateFooter({
                    linkGroups: draft.footer.linkGroups.filter((_, i) => i !== groupIndex),
                  })
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FooterGroupCard({
  group,
  groupIndex,
  labels,
  onChange,
  onRemove,
}: {
  group: CompanyFooterLinkGroupRecord;
  groupIndex: number;
  labels: {
    groupTitle: string;
    groupTitleAr: string;
    groupTitleEn: string;
    links: string;
    linkLabelAr: string;
    linkLabelEn: string;
    linkHref: string;
    addLink: string;
    removeGroup: string;
    removeLink: string;
    emptyLinks: string;
  };
  onChange: (next: CompanyFooterLinkGroupRecord) => void;
  onRemove: () => void;
}) {
  const displayName = group.title.ar.trim() || group.title.en.trim() || `${labels.groupTitle} ${groupIndex + 1}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      {/* Group header — عنوان المجموعة */}
      <header className="border-b border-border/60 bg-muted/25 px-4 py-3.5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {labels.groupTitle}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{displayName}</p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={labels.removeGroup}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{labels.groupTitleAr}</Label>
            <Input
              className="h-9 bg-background"
              value={group.title.ar}
              placeholder={labels.groupTitleAr}
              onChange={(event) =>
                onChange({ ...group, title: { ...group.title, ar: event.target.value } })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{labels.groupTitleEn}</Label>
            <Input
              className="h-9 bg-background"
              value={group.title.en}
              placeholder={labels.groupTitleEn}
              onChange={(event) =>
                onChange({ ...group, title: { ...group.title, en: event.target.value } })
              }
            />
          </div>
        </div>
      </header>

      {/* Links under the group */}
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />
            {labels.links}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-foreground/70">
              {group.links.length}
            </span>
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onChange({ ...group, links: [...group.links, emptyLink()] })}
          >
            <Plus className="h-3.5 w-3.5" />
            {labels.addLink}
          </Button>
        </div>

        {group.links.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/50 px-3 py-6 text-center text-xs text-muted-foreground">
            {labels.emptyLinks}
          </p>
        ) : (
          <ul className="space-y-2">
            {group.links.map((link, linkIndex) => (
              <li
                key={`${group.id}-${linkIndex}`}
                className={cn(
                  'rounded-xl border border-border/50 bg-muted/15 p-2.5 transition-colors',
                  'focus-within:border-primary/30 focus-within:bg-background',
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {linkIndex + 1}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onChange({
                        ...group,
                        links: group.links.filter((_, i) => i !== linkIndex),
                      })
                    }
                    aria-label={labels.removeLink}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Input
                    className="h-8 text-sm"
                    value={link.label.ar}
                    placeholder={labels.linkLabelAr}
                    onChange={(event) => {
                      const links = [...group.links];
                      links[linkIndex] = {
                        ...link,
                        label: { ...link.label, ar: event.target.value },
                      };
                      onChange({ ...group, links });
                    }}
                    aria-label={labels.linkLabelAr}
                  />
                  <Input
                    className="h-8 text-sm"
                    value={link.label.en}
                    placeholder={labels.linkLabelEn}
                    onChange={(event) => {
                      const links = [...group.links];
                      links[linkIndex] = {
                        ...link,
                        label: { ...link.label, en: event.target.value },
                      };
                      onChange({ ...group, links });
                    }}
                    aria-label={labels.linkLabelEn}
                  />
                  <Input
                    className="h-8 font-mono text-xs text-muted-foreground"
                    value={link.href}
                    placeholder={labels.linkHref}
                    dir="ltr"
                    onChange={(event) => {
                      const links = [...group.links];
                      links[linkIndex] = {
                        ...link,
                        href: event.target.value as CompanyNavItemRecord['href'],
                      };
                      onChange({ ...group, links });
                    }}
                    aria-label={labels.linkHref}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
