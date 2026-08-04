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

const FIELD =
  'h-11 min-h-11 w-full rounded-xl border-input bg-background px-3.5 text-sm';

type Props = {
  page: LegalPageContent;
  onChange: (page: LegalPageContent) => void;
};

/** Arabic-only legal page form for the pages studio editor. */
export function CmsLegalPageForm({ page, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)]">
      <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('studioBasics')}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('studioBasicsHint')}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('headline')}</Label>
          <Input
            className={FIELD}
            value={page.title.ar}
            onChange={(event) =>
              onChange({ ...page, title: withMirroredEn(event.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t('sectionBody')}</Label>
          <RichTextEditor
            value={page.body.ar}
            minHeightClassName="min-h-[280px]"
            onChange={(html) => onChange({ ...page, body: withMirroredEn(html) })}
          />
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('studioSeo')}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('studioSeoHint')}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('metaTitle')}</Label>
          <Input
            className={FIELD}
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
        <div className="space-y-2">
          <Label>{t('metaDescription')}</Label>
          <Textarea
            rows={5}
            className="rounded-xl"
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
    </div>
  );
}
