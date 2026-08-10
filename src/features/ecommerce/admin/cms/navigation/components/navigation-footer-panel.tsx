'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import type {
  CompanyConfigRecord,
  CompanyFooterLinkGroupRecord,
  CompanyNavItemRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  return (
    <div className="space-y-5">
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            </div>
          ) : null}
          {draft.footer.linkGroups.map((group, groupIndex) => (
            <div key={group.id} className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
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

              <div className="flex justify-end border-t border-border/60 pt-3">
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
                <div
                  key={`${group.id}-${linkIndex}`}
                  className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3"
                >
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        const linkGroups = [...draft.footer.linkGroups];
                        linkGroups[groupIndex] = {
                          ...group,
                          links: group.links.filter((_, i) => i !== linkIndex),
                        };
                        updateFooter({ linkGroups });
                      }}
                    >
                      <Trash2 className="me-2 h-4 w-4" />
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
    </div>
  );
}
