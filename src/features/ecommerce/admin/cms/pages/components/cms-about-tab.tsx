'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import type { AboutPageContent } from '@/features/ecommerce/storefront/domain/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  about: AboutPageContent;
  onChange: (about: AboutPageContent) => void;
};

function emptySection() {
  return {
    id: crypto.randomUUID(),
    title: { ar: '', en: '' },
    body: { ar: '', en: '' },
  };
}

function emptyStat() {
  return {
    id: crypto.randomUUID(),
    label: { ar: '', en: '' },
    value: '',
  };
}

function withMirroredEn(ar: string) {
  return { ar, en: ar };
}

const FIELD =
  'h-11 min-h-11 w-full rounded-xl border-input bg-background px-3.5 text-sm';

/** Arabic-only about form for the pages studio editor. */
export function CmsAboutTab({ about, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');
  const stats = about.stats ?? [];

  return (
    <div className="sto-cms-split">
      <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('studioBasics')}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('studioBasicsHint')}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('headline')}</Label>
          <Input
            className={FIELD}
            value={about.headline.ar}
            onChange={(event) =>
              onChange({ ...about, headline: withMirroredEn(event.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t('intro')}</Label>
          <Textarea
            rows={5}
            className="rounded-xl"
            value={about.intro.ar}
            onChange={(event) =>
              onChange({ ...about, intro: withMirroredEn(event.target.value) })
            }
          />
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('stats')}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('statsHint')}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onChange({ ...about, stats: [...stats, emptyStat()] })}
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('addStat')}
          </Button>
        </div>

        {stats.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-3 py-8 text-center text-xs text-muted-foreground">
            {t('statsEmpty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {stats.map((stat, index) => (
              <li
                key={stat.id}
                className="space-y-3 rounded-2xl border border-border/60 bg-card p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t('stats')} {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() =>
                      onChange({
                        ...about,
                        stats: stats.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="me-1.5 h-4 w-4" />
                    {t('removeStat')}
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('statValue')}</Label>
                    <Input
                      className={FIELD}
                      value={stat.value}
                      placeholder={t('statValuePlaceholder')}
                      onChange={(event) => {
                        const next = [...stats];
                        next[index] = { ...stat, value: event.target.value };
                        onChange({ ...about, stats: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('statLabel')}</Label>
                    <Input
                      className={FIELD}
                      value={stat.label.ar}
                      placeholder={t('statLabelPlaceholder')}
                      onChange={(event) => {
                        const next = [...stats];
                        next[index] = {
                          ...stat,
                          label: withMirroredEn(event.target.value),
                        };
                        onChange({ ...about, stats: next });
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:col-span-full sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('sections')}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('sectionsHint')}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onChange({ ...about, sections: [...about.sections, emptySection()] })}
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('addSection')}
          </Button>
        </div>

        {about.sections.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-3 py-8 text-center text-xs text-muted-foreground">
            {t('sectionsEmpty')}
          </p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {about.sections.map((section, index) => (
              <li
                key={section.id}
                className="space-y-3 rounded-2xl border border-border/60 bg-card p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t('sections')} {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() =>
                      onChange({
                        ...about,
                        sections: about.sections.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="me-1.5 h-4 w-4" />
                    {t('removeSection')}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('sectionTitle')}</Label>
                  <Input
                    className={FIELD}
                    value={section.title.ar}
                    onChange={(event) => {
                      const sections = [...about.sections];
                      sections[index] = {
                        ...section,
                        title: withMirroredEn(event.target.value),
                      };
                      onChange({ ...about, sections });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('sectionBody')}</Label>
                  <Textarea
                    rows={4}
                    className="rounded-xl"
                    value={section.body.ar}
                    onChange={(event) => {
                      const sections = [...about.sections];
                      sections[index] = {
                        ...section,
                        body: withMirroredEn(event.target.value),
                      };
                      onChange({ ...about, sections });
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
