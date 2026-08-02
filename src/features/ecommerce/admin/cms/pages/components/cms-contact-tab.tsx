'use client';

import { useTranslations } from 'next-intl';
import type { ContactPageContent } from '@/features/ecommerce/storefront/domain/content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  contact: ContactPageContent;
  onChange: (contact: ContactPageContent) => void;
};

export function CmsContactTab({ contact, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-base">{t('contact')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('headlineAr')}</Label>
          <Input
            value={contact.headline.ar}
            onChange={(event) =>
              onChange({
                ...contact,
                headline: { ...contact.headline, ar: event.target.value },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('headlineEn')}</Label>
          <Input
            value={contact.headline.en}
            onChange={(event) =>
              onChange({
                ...contact,
                headline: { ...contact.headline, en: event.target.value },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('introAr')}</Label>
          <Textarea
            value={contact.intro.ar}
            onChange={(event) =>
              onChange({
                ...contact,
                intro: { ...contact.intro, ar: event.target.value },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('introEn')}</Label>
          <Textarea
            value={contact.intro.en}
            onChange={(event) =>
              onChange({
                ...contact,
                intro: { ...contact.intro, en: event.target.value },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('hoursAr')}</Label>
          <Input
            value={contact.hours?.ar ?? ''}
            onChange={(event) =>
              onChange({
                ...contact,
                hours: { ar: event.target.value, en: contact.hours?.en ?? '' },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('hoursEn')}</Label>
          <Input
            value={contact.hours?.en ?? ''}
            onChange={(event) =>
              onChange({
                ...contact,
                hours: { ar: contact.hours?.ar ?? '', en: event.target.value },
              })
            }
          />
        </div>
        <div className="space-y-1.5 border-t border-border/60 pt-4 sm:col-span-2">
          <Label>{t('mapEmbedUrl')}</Label>
          <Input
            value={contact.mapEmbedUrl ?? ''}
            onChange={(event) => onChange({ ...contact, mapEmbedUrl: event.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
