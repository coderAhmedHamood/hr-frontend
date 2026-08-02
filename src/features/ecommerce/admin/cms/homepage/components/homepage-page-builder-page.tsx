'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  LayoutTemplate,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getAllSectionDefinitions } from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type { SectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import type { SectionType } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import { useHomepagePageRecord } from '@/features/ecommerce/admin/cms/homepage/hooks/use-homepage-page';
import { useHomepagePageMutations } from '@/features/ecommerce/admin/cms/homepage/hooks/use-homepage-mutations';
import {
  createSectionFromDefinition,
  reorderSections,
} from '@/features/ecommerce/admin/cms/homepage/lib/create-section';
import { SectionEditDialog } from '@/features/ecommerce/admin/cms/homepage/components/section-edit-dialog';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

function sectionDisplayName(section: SectionRecord, locale: string): string {
  const definition = getAllSectionDefinitions().find((item) => item.type === section.type);
  if (!definition) return section.type;
  return locale === 'en' ? definition.displayName.en : definition.displayName.ar;
}

function sectionStatusBadgeVariant(status: SectionRecord['status']): 'secondary' | 'success' | 'subtle' {
  if (status === 'published') return 'success';
  if (status === 'draft') return 'secondary';
  return 'subtle';
}

export function HomepagePageBuilderPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.homepage');
  const tModule = useTranslations('ecommerceAdmin.module');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const { data, isLoading, isError, refetch } = useHomepagePageRecord(companyId);
  const { save } = useHomepagePageMutations(companyId);

  const [draft, setDraft] = React.useState<PageRecord | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<SectionRecord | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [sectionToRemove, setSectionToRemove] = React.useState<SectionRecord | null>(null);

  React.useEffect(() => {
    if (data) {
      setDraft(structuredClone(data));
      setDirty(false);
    }
  }, [data]);

  const definitions = getAllSectionDefinitions();
  const sections = draft ? [...draft.sections].sort((a, b) => a.order - b.order) : [];

  function updateDraft(updater: (current: PageRecord) => PageRecord) {
    setDraft((current) => {
      if (!current) return current;
      setDirty(true);
      return updater(current);
    });
  }

  async function persist(status?: PageRecord['status']) {
    if (!draft) return;
    const next: PageRecord = {
      ...draft,
      status: status ?? draft.status,
      publishedAt:
        (status ?? draft.status) === 'published'
          ? (draft.publishedAt ?? new Date().toISOString())
          : draft.publishedAt,
      sections: reorderSections(draft.sections),
    };
    const saved = await save.mutateAsync(next);
    setDraft(saved);
    setDirty(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} iconName="LayoutTemplate" />

      <div className="flex flex-wrap justify-end gap-2">
        <>
            <Button type="button" variant="outline" asChild>
              <Link href="/ar/store" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t('previewStorefront')}
              </Link>
            </Button>
            <Button type="button" variant="outline" disabled={!draft || save.isPending} onClick={() => void persist('draft')}>
              {t('saveDraft')}
            </Button>
            <Button type="button" disabled={!draft || save.isPending} onClick={() => void persist('published')}>
              {save.isPending ? tCommon('status.saving') : t('publish')}
            </Button>
          </>
      </div>


      {dirty ? (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {t('unsavedHint')}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
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

      {draft ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tModule('title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('displayName')} (AR)</Label>
                <Input
                  value={draft.displayName.ar}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      displayName: { ...current.displayName, ar: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('displayName')} (EN)</Label>
                <Input
                  value={draft.displayName.en}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      displayName: { ...current.displayName, en: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('pageStatus')}</Label>
                <Select
                  value={draft.status}
                  onValueChange={(status) =>
                    updateDraft((current) => ({
                      ...current,
                      status: status as PageRecord['status'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('statuses.draft')}</SelectItem>
                    <SelectItem value="published">{t('statuses.published')}</SelectItem>
                    <SelectItem value="archived">{t('statuses.archived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">{t('sectionCount', { count: sections.length })}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">{t('sectionPalette')}</h2>
            <Button type="button" size="sm" onClick={() => setPaletteOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('addSection')}
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
              <LayoutTemplate className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <Card className="transition-shadow hover:shadow-elevated">
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <p className="truncate font-medium text-foreground">
                          {sectionDisplayName(section, locale)}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="outline">{section.type}</Badge>
                          <span>{t('order')}: {section.order}</span>
                          <Badge variant={section.enabled ? 'success' : 'subtle'}>
                            {section.enabled ? t('enabled') : t('disabled')}
                          </Badge>
                          <Badge variant={sectionStatusBadgeVariant(section.status)}>
                            {t(`statuses.${section.status}`)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1">
                          <Switch
                            checked={section.enabled}
                            onCheckedChange={(enabled) =>
                              updateDraft((current) => ({
                                ...current,
                                sections: current.sections.map((item) =>
                                  item.id === section.id ? { ...item, enabled } : item,
                                ),
                              }))
                            }
                          />
                          <span className="text-xs text-muted-foreground">{t('enabled')}</span>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          disabled={index === 0}
                          onClick={() =>
                            updateDraft((current) => {
                              const ordered = [...current.sections].sort((a, b) => a.order - b.order);
                              if (index === 0) return current;
                              const swap = ordered[index - 1];
                              ordered[index - 1] = ordered[index];
                              ordered[index] = swap;
                              return { ...current, sections: reorderSections(ordered) };
                            })
                          }
                          aria-label={t('moveUp')}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          disabled={index === sections.length - 1}
                          onClick={() =>
                            updateDraft((current) => {
                              const ordered = [...current.sections].sort((a, b) => a.order - b.order);
                              if (index >= ordered.length - 1) return current;
                              const swap = ordered[index + 1];
                              ordered[index + 1] = ordered[index];
                              ordered[index] = swap;
                              return { ...current, sections: reorderSections(ordered) };
                            })
                          }
                          aria-label={t('moveDown')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingSection(section)}>
                          <Pencil className="h-4 w-4" />
                          {t('editSection')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSectionToRemove(section)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('removeSection')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sectionPalette')}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {definitions.map((definition) => (
              <li key={definition.type}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start px-3 py-3 text-start"
                  onClick={() => {
                    updateDraft((current) => ({
                      ...current,
                      sections: [
                        ...current.sections,
                        createSectionFromDefinition(definition.type as SectionType, current.sections),
                      ],
                    }));
                    setPaletteOpen(false);
                  }}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {locale === 'en' ? definition.displayName.en : definition.displayName.ar}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {locale === 'en' ? definition.description.en : definition.description.ar}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <SectionEditDialog
        open={Boolean(editingSection)}
        section={editingSection}
        onOpenChange={(open) => {
          if (!open) setEditingSection(null);
        }}
        onSave={(nextSection) => {
          updateDraft((current) => ({
            ...current,
            sections: current.sections.map((item) => (item.id === nextSection.id ? nextSection : item)),
          }));
          setEditingSection(null);
        }}
      />

      <Dialog open={Boolean(sectionToRemove)} onOpenChange={(open) => !open && setSectionToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('removeConfirmTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('removeConfirmDescription', {
              name: sectionToRemove ? sectionDisplayName(sectionToRemove, locale) : '',
            })}
          </p>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setSectionToRemove(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!sectionToRemove) return;
                updateDraft((current) => ({
                  ...current,
                  sections: reorderSections(current.sections.filter((item) => item.id !== sectionToRemove.id)),
                }));
                setSectionToRemove(null);
              }}
            >
              {tCommon('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
