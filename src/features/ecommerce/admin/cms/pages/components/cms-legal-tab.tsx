'use client';

import { useTranslations } from 'next-intl';
import type { LegalPageContent, LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export const LEGAL_SLUGS: LegalPageSlug[] = ['privacy', 'terms', 'returns'];

export function emptyLegalPage(slug: LegalPageSlug): LegalPageContent {
  return {
    slug,
    title: { ar: '', en: '' },
    body: { ar: '', en: '' },
    seo: {
      metaTitle: { ar: '', en: '' },
      metaDescription: { ar: '', en: '' },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function ensureLegalPages(legal: LegalPageContent[]): LegalPageContent[] {
  return LEGAL_SLUGS.map((slug) => legal.find((page) => page.slug === slug) ?? emptyLegalPage(slug));
}

function withMirroredEn(ar: string) {
  return { ar, en: ar };
}

type Props = {
  page: LegalPageContent;
  onChange: (page: LegalPageContent) => void;
};

/** Arabic-only legal page form — used inside the pages DataTable edit dialog. */
export function CmsLegalPageForm({ page, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  return (
    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pe-1">
      <div className="space-y-1.5">
        <Label>{t('headline')}</Label>
        <Input
          value={page.title.ar}
          onChange={(event) =>
            onChange({ ...page, title: withMirroredEn(event.target.value) })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('sectionBody')}</Label>
        <RichTextEditor
          value={page.body.ar}
          minHeightClassName="min-h-[200px]"
          onChange={(html) => onChange({ ...page, body: withMirroredEn(html) })}
        />
      </div>
      <div className="space-y-1.5 border-t border-border/60 pt-3">
        <Label>{t('metaTitle')}</Label>
        <Input
          value={page.seo.metaTitle?.ar ?? ''}
          onChange={(event) =>
            onChange({
              ...page,
              seo: {
                ...page.seo,
                metaTitle: withMirroredEn(event.target.value),
              },
            })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('metaDescription')}</Label>
        <Textarea
          rows={3}
          value={page.seo.metaDescription?.ar ?? ''}
          onChange={(event) =>
            onChange({
              ...page,
              seo: {
                ...page.seo,
                metaDescription: withMirroredEn(event.target.value),
              },
            })
          }
        />
      </div>
    </div>
  );
}
