'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import type { AboutPageContent } from '@/features/ecommerce/storefront/domain/content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function CmsAboutTab({ about, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">{t('about')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('headlineAr')}</Label>
            <Input
              value={about.headline.ar}
              onChange={(event) =>
                onChange({
                  ...about,
                  headline: { ...about.headline, ar: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('headlineEn')}</Label>
            <Input
              value={about.headline.en}
              onChange={(event) =>
                onChange({
                  ...about,
                  headline: { ...about.headline, en: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('introAr')}</Label>
            <Textarea
              value={about.intro.ar}
              onChange={(event) =>
                onChange({
                  ...about,
                  intro: { ...about.intro, ar: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('introEn')}</Label>
            <Textarea
              value={about.intro.en}
              onChange={(event) =>
                onChange({
                  ...about,
                  intro: { ...about.intro, en: event.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <h2 className="text-sm font-semibold text-foreground">{t('sections')}</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...about, sections: [...about.sections, emptySection()] })}
        >
          <Plus className="me-2 h-4 w-4" />
          {t('addSection')}
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {about.sections.map((section, index) => (
          <li key={section.id}>
            <Card className="transition-shadow hover:shadow-elevated">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground/70">
                    {t('sections')} {index + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onChange({
                        ...about,
                        sections: about.sections.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {t('removeSection')}
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('titleAr')}</Label>
                    <Input
                      value={section.title.ar}
                      onChange={(event) => {
                        const sections = [...about.sections];
                        sections[index] = {
                          ...section,
                          title: { ...section.title, ar: event.target.value },
                        };
                        onChange({ ...about, sections });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('titleEn')}</Label>
                    <Input
                      value={section.title.en}
                      onChange={(event) => {
                        const sections = [...about.sections];
                        sections[index] = {
                          ...section,
                          title: { ...section.title, en: event.target.value },
                        };
                        onChange({ ...about, sections });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('bodyAr')}</Label>
                    <Textarea
                      value={section.body.ar}
                      onChange={(event) => {
                        const sections = [...about.sections];
                        sections[index] = {
                          ...section,
                          body: { ...section.body, ar: event.target.value },
                        };
                        onChange({ ...about, sections });
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('bodyEn')}</Label>
                    <Textarea
                      value={section.body.en}
                      onChange={(event) => {
                        const sections = [...about.sections];
                        sections[index] = {
                          ...section,
                          body: { ...section.body, en: event.target.value },
                        };
                        onChange({ ...about, sections });
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
