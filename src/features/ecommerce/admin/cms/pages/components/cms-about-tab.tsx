'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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

function withMirroredEn(ar: string) {
  return { ar, en: ar };
}

/** Arabic-only about form — used inside the pages DataTable edit dialog. */
export function CmsAboutTab({ about, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  return (
    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pe-1">
      <div className="space-y-1.5">
        <Label>{t('headline')}</Label>
        <Input
          value={about.headline.ar}
          onChange={(event) =>
            onChange({ ...about, headline: withMirroredEn(event.target.value) })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('intro')}</Label>
        <Textarea
          rows={3}
          value={about.intro.ar}
          onChange={(event) =>
            onChange({ ...about, intro: withMirroredEn(event.target.value) })
          }
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <h3 className="text-sm font-semibold text-foreground">{t('sections')}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...about, sections: [...about.sections, emptySection()] })}
        >
          <Plus className="me-1.5 h-4 w-4" />
          {t('addSection')}
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {about.sections.map((section, index) => (
          <li
            key={section.id}
            className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-3"
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
                rows={3}
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
    </div>
  );
}
