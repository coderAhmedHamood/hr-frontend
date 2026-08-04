'use client';

import { useTranslations } from 'next-intl';
import type { LegalPageContent, LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

type Props = {
  legal: LegalPageContent[];
  onChange: (legal: LegalPageContent[]) => void;
};

export function CmsLegalTab({ legal, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.cmsPages');

  function patchPage(slug: LegalPageSlug, next: LegalPageContent) {
    const index = legal.findIndex((page) => page.slug === slug);
    const updated = [...legal];
    if (index === -1) updated.push(next);
    else updated[index] = next;
    onChange(ensureLegalPages(updated));
  }

  return (
    <div className="flex flex-col gap-4">
      {LEGAL_SLUGS.map((slug) => {
        const page = legal.find((item) => item.slug === slug) ?? emptyLegalPage(slug);

        return (
          <Card key={slug}>
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">{t(slug)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('titleAr')}</Label>
                  <Input
                    value={page.title.ar}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        title: { ...page.title, ar: event.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('titleEn')}</Label>
                  <Input
                    value={page.title.en}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        title: { ...page.title, en: event.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('bodyAr')}</Label>
                  <Textarea
                    value={page.body.ar}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        body: { ...page.body, ar: event.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('bodyEn')}</Label>
                  <Textarea
                    value={page.body.en}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        body: { ...page.body, en: event.target.value },
                      })
                    }
                  />
                </div>
                <div className="border-t border-border/60 sm:col-span-2" />
                <div className="space-y-1.5">
                  <Label>{t('metaTitleAr')}</Label>
                  <Input
                    value={page.seo.metaTitle?.ar ?? ''}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        seo: {
                          ...page.seo,
                          metaTitle: {
                            ar: event.target.value,
                            en: page.seo.metaTitle?.en ?? '',
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('metaTitleEn')}</Label>
                  <Input
                    value={page.seo.metaTitle?.en ?? ''}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        seo: {
                          ...page.seo,
                          metaTitle: {
                            ar: page.seo.metaTitle?.ar ?? '',
                            en: event.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('metaDescriptionAr')}</Label>
                  <Textarea
                    value={page.seo.metaDescription?.ar ?? ''}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        seo: {
                          ...page.seo,
                          metaDescription: {
                            ar: event.target.value,
                            en: page.seo.metaDescription?.en ?? '',
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('metaDescriptionEn')}</Label>
                  <Textarea
                    value={page.seo.metaDescription?.en ?? ''}
                    onChange={(event) =>
                      patchPage(slug, {
                        ...page,
                        seo: {
                          ...page.seo,
                          metaDescription: {
                            ar: page.seo.metaDescription?.ar ?? '',
                            en: event.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
