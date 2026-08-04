'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type {
  CompanyFooterLinkGroupRecord,
  CompanyNavItemRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function emptyLink(): CompanyNavItemRecord {
  return { label: { ar: '', en: '' }, href: '/store' };
}

function emptyGroup(): CompanyFooterLinkGroupRecord {
  return {
    id: newId('group'),
    title: { ar: '', en: '' },
    links: [emptyLink()],
  };
}

export function FooterLinkGroupsEditor({
  groups,
  onChange,
}: {
  groups: CompanyFooterLinkGroupRecord[];
  onChange: (groups: CompanyFooterLinkGroupRecord[]) => void;
}) {
  const t = useTranslations('ecommerceAdmin.footer');

  function patchGroup(index: number, patch: Partial<CompanyFooterLinkGroupRecord>) {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  }

  function patchLink(
    groupIndex: number,
    linkIndex: number,
    patch: Partial<CompanyNavItemRecord>,
  ) {
    const group = groups[groupIndex];
    if (!group) return;
    patchGroup(groupIndex, {
      links: group.links.map((link, i) => (i === linkIndex ? { ...link, ...patch } : link)),
    });
  }

  function moveGroup(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= groups.length) return;
    const copy = [...groups];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item!);
    onChange(copy);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">{t('linkGroupsHint')}</p>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : null}

      {groups.map((group, groupIndex) => (
        <section
          key={group.id}
          className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-sm font-semibold">{t('groupTitle')}</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={groupIndex === 0}
                onClick={() => moveGroup(groupIndex, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={groupIndex === groups.length - 1}
                onClick={() => moveGroup(groupIndex, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onChange(groups.filter((_, i) => i !== groupIndex))}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">{t('removeGroup')}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('groupTitleAr')}</Label>
              <Input
                value={group.title.ar}
                onChange={(event) =>
                  patchGroup(groupIndex, {
                    title: { ...group.title, ar: event.target.value, en: event.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('groupTitleEn')}</Label>
              <Input
                value={group.title.en}
                onChange={(event) =>
                  patchGroup(groupIndex, {
                    title: { ...group.title, en: event.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('linksInGroup')}</Label>
            {group.links.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('emptyLinks')}</p>
            ) : null}
            {group.links.map((link, linkIndex) => (
              <div
                key={`${group.id}-${linkIndex}`}
                className="grid gap-2 rounded-xl border border-border/60 bg-card p-3 sm:grid-cols-[1fr_1fr_1.2fr_auto]"
              >
                <Input
                  placeholder={t('linkLabelAr')}
                  value={link.label.ar}
                  onChange={(event) =>
                    patchLink(groupIndex, linkIndex, {
                      label: { ...link.label, ar: event.target.value, en: event.target.value },
                    })
                  }
                />
                <Input
                  placeholder={t('linkLabelEn')}
                  value={link.label.en}
                  onChange={(event) =>
                    patchLink(groupIndex, linkIndex, {
                      label: { ...link.label, en: event.target.value },
                    })
                  }
                />
                <Input
                  placeholder={t('linkHref')}
                  value={link.href}
                  onChange={(event) => {
                    const href = event.target.value.trim();
                    patchLink(groupIndex, linkIndex, {
                      href: (href.startsWith('/store') ? href : '/store') as `/store${string}` | '/store',
                    });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() =>
                    patchGroup(groupIndex, {
                      links: group.links.filter((_, i) => i !== linkIndex),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => patchGroup(groupIndex, { links: [...group.links, emptyLink()] })}
            >
              <Plus className="h-4 w-4" />
              {t('addLink')}
            </Button>
          </div>
        </section>
      ))}

      <Button
        type="button"
        variant="outline"
        className="gap-1.5 rounded-xl"
        onClick={() => onChange([...groups, emptyGroup()])}
      >
        <Plus className="h-4 w-4" />
        {t('addGroup')}
      </Button>
    </div>
  );
}
