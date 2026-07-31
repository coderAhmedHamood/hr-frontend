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

/** Arabic-only contact form — used inside the pages DataTable edit dialog. */
export function CmsContactTab({ contact, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <Label>{t('headline')}</Label>
        <Input
          value={contact.headline.ar}
          onChange={(event) =>
            onChange({ ...contact, headline: withMirroredEn(event.target.value) })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('intro')}</Label>
        <Textarea
          rows={3}
          value={contact.intro.ar}
          onChange={(event) =>
            onChange({ ...contact, intro: withMirroredEn(event.target.value) })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('hours')}</Label>
        <Input
          value={contact.hours?.ar ?? ''}
          onChange={(event) =>
            onChange({ ...contact, hours: withMirroredEn(event.target.value) })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('mapEmbedUrl')}</Label>
        <Input
          dir="ltr"
          className="font-mono text-sm"
          value={contact.mapEmbedUrl ?? ''}
          onChange={(event) => onChange({ ...contact, mapEmbedUrl: event.target.value })}
        />
      </div>
    </div>
  );
}
