'use client';

import { useTranslations } from 'next-intl';
import type { ContactPageContent } from '@/features/ecommerce/storefront/domain/content';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  contact: ContactPageContent;
  onChange: (contact: ContactPageContent) => void;
};

function withMirroredEn(ar: string) {
  return { ar, en: ar };
}

const FIELD =
  'h-11 min-h-11 w-full rounded-xl border-input bg-background px-3.5 text-sm';

/** Arabic-only contact form for the pages studio editor. */
export function CmsContactTab({ contact, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('studioBasics')}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('studioBasicsHint')}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('headline')}</Label>
          <Input
            className={FIELD}
            value={contact.headline.ar}
            onChange={(event) =>
              onChange({ ...contact, headline: withMirroredEn(event.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t('intro')}</Label>
          <Textarea
            rows={5}
            className="rounded-xl"
            value={contact.intro.ar}
            onChange={(event) =>
              onChange({ ...contact, intro: withMirroredEn(event.target.value) })
            }
          />
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('studioContactDetails')}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('studioContactDetailsHint')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>{t('hours')}</Label>
            <Input
              className={FIELD}
              value={contact.hours?.ar ?? ''}
              onChange={(event) =>
                onChange({ ...contact, hours: withMirroredEn(event.target.value) })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t('mapEmbedUrl')}</Label>
            <Input
              dir="ltr"
              className={cnField()}
              value={contact.mapEmbedUrl ?? ''}
              onChange={(event) => onChange({ ...contact, mapEmbedUrl: event.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function cnField() {
  return `${FIELD} font-mono text-sm`;
}
