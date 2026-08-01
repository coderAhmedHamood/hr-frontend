'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette, Phone, Share2, Search, Truck } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getCmsCompanyRecord, saveCmsCompanyRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import {
  COMPANY_SOCIAL_NETWORKS,
  normalizeSocialLinks,
  type CompanyConfigRecord,
  type CompanySocialNetwork,
} from '@/features/ecommerce/storefront/domain/company-config';
import { ImagePicker } from '@/features/ecommerce/admin/cms/homepage/components/section-entity-pickers';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const SETTINGS_QUERY_KEY = ['ecommerce-cms', 'company', 'settings'] as const;

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,،\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function WebsiteSettingsPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.settings');
  const tSeo = useTranslations('ecommerceAdmin.seo');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...SETTINGS_QUERY_KEY, companyId],
    queryFn: async () => {
      const record = await getCmsCompanyRecord(companyId);
      if (!record) throw new Error('COMPANY_NOT_FOUND');
      return {
        ...record,
        social: normalizeSocialLinks(record.social),
        seo: {
          ...record.seo,
          keywords: record.seo.keywords ?? [],
        },
      } satisfies CompanyConfigRecord;
    },
  });

  const [draft, setDraft] = React.useState<CompanyConfigRecord | null>(null);
  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (record: CompanyConfigRecord) =>
      saveCmsCompanyRecord({
        ...record,
        social: normalizeSocialLinks(record.social),
        seo: {
          ...record.seo,
          keywords: (record.seo.keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean),
        },
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData([...SETTINGS_QUERY_KEY, companyId], {
        ...saved,
        social: normalizeSocialLinks(saved.social),
        seo: { ...saved.seo, keywords: saved.seo.keywords ?? [] },
      });
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      setDraft({
        ...saved,
        social: normalizeSocialLinks(saved.social),
        seo: { ...saved.seo, keywords: saved.seo.keywords ?? [] },
      });
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  function patchSeo(
    path: 'homeTitle' | 'homeDescription' | 'productsTitle' | 'productsDescription',
    value: string,
  ) {
    if (!draft) return;
    setDraft({
      ...draft,
      seo: {
        ...draft.seo,
        [path]: { ar: value, en: value },
      },
    });
  }

  function patchSocial(network: CompanySocialNetwork, patch: { url?: string; enabled?: boolean }) {
    if (!draft) return;
    const current = draft.social[network] ?? { url: '', enabled: false };
    const next = {
      url: patch.url ?? current.url,
      enabled: patch.enabled ?? current.enabled,
    };
    setDraft({
      ...draft,
      social: {
        ...draft.social,
        [network]: next,
      },
    });
  }

  const keywordsText = (draft?.seo.keywords ?? []).join('، ');
  const previewTitle = draft?.seo.homeTitle.ar.trim() || tSeo('previewTitleEmpty');
  const previewDescription = draft?.seo.homeDescription.ar.trim() || tSeo('previewDescriptionEmpty');

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="Settings" />

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          disabled={!draft || save.isPending}
          onClick={() => draft && void save.mutateAsync(draft)}
        >
          {save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-muted/50" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
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
        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="branding" className="gap-1.5">
              <Palette className="h-4 w-4" />
              {t('tabs.branding')}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1.5">
              <Phone className="h-4 w-4" />
              {t('tabs.contact')}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5">
              <Share2 className="h-4 w-4" />
              {t('tabs.social')}
            </TabsTrigger>
            <TabsTrigger value="checkout" className="gap-1.5">
              <Truck className="h-4 w-4" />
              {t('tabs.checkout')}
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5">
              <Search className="h-4 w-4" />
              {t('tabs.seo')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tabs.branding')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('name')}</Label>
                  <Input
                    value={draft.name.ar}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraft({ ...draft, name: { ar: value, en: value } });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('logo')}</Label>
                  <ImagePicker
                    value={draft.logoUrl}
                    onChange={(logoUrl) => setDraft({ ...draft, logoUrl })}
                  />
                  <p className="text-xs text-muted-foreground">{t('logoHint')}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('favicon')}</Label>
                  <ImagePicker
                    value={draft.faviconUrl}
                    onChange={(faviconUrl) => setDraft({ ...draft, faviconUrl })}
                  />
                  <p className="text-xs text-muted-foreground">{t('faviconHint')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tabs.contact')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('phone')}</Label>
                  <Input
                    value={draft.contact.phone ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, contact: { ...draft.contact, phone: event.target.value } })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('email')}</Label>
                  <Input
                    value={draft.contact.email ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, contact: { ...draft.contact, email: event.target.value } })
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('address')}</Label>
                  <Input
                    value={draft.contact.address ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, contact: { ...draft.contact, address: event.target.value } })
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('commercialRegistration')}</Label>
                  <Input
                    value={draft.footer.commercialRegistration ?? ''}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        footer: {
                          ...draft.footer,
                          commercialRegistration: event.target.value || undefined,
                        },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">{t('commercialRegistrationHint')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tabs.social')}</CardTitle>
                <CardDescription>{t('socialHint')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {COMPANY_SOCIAL_NETWORKS.map((network) => {
                  const entry = draft.social[network] ?? { url: '', enabled: false };
                  return (
                    <div
                      key={network}
                      className="grid gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="space-y-1.5">
                        <Label>{t(network)}</Label>
                        <Input
                          dir="ltr"
                          className="font-mono text-sm"
                          placeholder={t('socialUrlPlaceholder')}
                          value={entry.url}
                          onChange={(event) => patchSocial(network, { url: event.target.value })}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-xs text-muted-foreground">
                          {entry.enabled ? t('socialEnabled') : t('socialDisabled')}
                        </span>
                        <Switch
                          checked={entry.enabled}
                          onCheckedChange={(enabled) => patchSocial(network, { enabled })}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkout" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tabs.checkout')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('freeShippingThreshold')}</Label>
                  <Input
                    type="number"
                    min={0}
                    dir="ltr"
                    value={draft.checkout?.freeShippingThreshold ?? 200}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        checkout: {
                          ...(draft.checkout ?? {
                            cities: [],
                            defaultCity: '',
                            freeShippingThreshold: 200,
                            standardShippingFee: 25,
                            paymentMethods: ['cash_on_delivery', 'card'],
                          }),
                          freeShippingThreshold: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('standardShippingFee')}</Label>
                  <Input
                    type="number"
                    min={0}
                    dir="ltr"
                    value={draft.checkout?.standardShippingFee ?? 25}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        checkout: {
                          ...(draft.checkout ?? {
                            cities: [],
                            defaultCity: '',
                            freeShippingThreshold: 200,
                            standardShippingFee: 25,
                            paymentMethods: ['cash_on_delivery', 'card'],
                          }),
                          standardShippingFee: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('defaultCity')}</Label>
                  <Input
                    value={draft.checkout?.defaultCity ?? ''}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        checkout: {
                          ...(draft.checkout ?? {
                            cities: [],
                            defaultCity: '',
                            freeShippingThreshold: 200,
                            standardShippingFee: 25,
                            paymentMethods: ['cash_on_delivery', 'card'],
                          }),
                          defaultCity: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('cities')}</Label>
                  <Textarea
                    rows={4}
                    value={(draft.checkout?.cities ?? []).join('\n')}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        checkout: {
                          ...(draft.checkout ?? {
                            cities: [],
                            defaultCity: '',
                            freeShippingThreshold: 200,
                            standardShippingFee: 25,
                            paymentMethods: ['cash_on_delivery', 'card'],
                          }),
                          cities: event.target.value
                            .split('\n')
                            .map((city) => city.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">{t('citiesHint')}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t('paymentMethods')}</Label>
                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        ['cash_on_delivery', t('paymentCod')],
                        ['card', t('paymentCard')],
                      ] as const
                    ).map(([id, label]) => {
                      const checked = (draft.checkout?.paymentMethods ?? []).includes(id);
                      return (
                        <label key={id} className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const current = draft.checkout?.paymentMethods ?? [];
                              const paymentMethods = event.target.checked
                                ? [...current.filter((method) => method !== id), id]
                                : current.filter((method) => method !== id);
                              setDraft({
                                ...draft,
                                checkout: {
                                  ...(draft.checkout ?? {
                                    cities: [],
                                    defaultCity: '',
                                    freeShippingThreshold: 200,
                                    standardShippingFee: 25,
                                    paymentMethods: [],
                                  }),
                                  paymentMethods: paymentMethods.length > 0 ? paymentMethods : [id],
                                },
                              });
                            }}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('tabs.seo')}</CardTitle>
                  <CardDescription>{tSeo('formHint')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <section className="space-y-3 rounded-xl border border-border/70 p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="subtle">{tSeo('sectionHome')}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{tSeo('homeTitle')}</Label>
                      <Input
                        value={draft.seo.homeTitle.ar}
                        maxLength={70}
                        onChange={(event) => patchSeo('homeTitle', event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">{tSeo('homeTitleHint')}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{tSeo('homeDescription')}</Label>
                      <Textarea
                        rows={3}
                        value={draft.seo.homeDescription.ar}
                        maxLength={170}
                        onChange={(event) => patchSeo('homeDescription', event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">{tSeo('homeDescriptionHint')}</p>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-xl border border-border/70 p-4">
                    <Badge variant="subtle">{tSeo('sectionKeywords')}</Badge>
                    <div className="space-y-1.5">
                      <Label>{tSeo('keywords')}</Label>
                      <Textarea
                        rows={3}
                        value={keywordsText}
                        placeholder={tSeo('keywordsPlaceholder')}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            seo: {
                              ...draft.seo,
                              keywords: parseKeywords(event.target.value),
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">{tSeo('keywordsHint')}</p>
                      {(draft.seo.keywords ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(draft.seo.keywords ?? []).map((keyword) => (
                            <Badge key={keyword} variant="subtle">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section className="space-y-3 rounded-xl border border-border/70 p-4">
                    <Badge variant="subtle">{tSeo('sectionProducts')}</Badge>
                    <div className="space-y-1.5">
                      <Label>{tSeo('productsTitle')}</Label>
                      <Input
                        value={draft.seo.productsTitle.ar}
                        maxLength={70}
                        onChange={(event) => patchSeo('productsTitle', event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">{tSeo('productsTitleHint')}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{tSeo('productsDescription')}</Label>
                      <Textarea
                        rows={3}
                        value={draft.seo.productsDescription.ar}
                        maxLength={170}
                        onChange={(event) => patchSeo('productsDescription', event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">{tSeo('productsDescriptionHint')}</p>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-xl border border-border/70 p-4">
                    <Badge variant="subtle">{tSeo('sectionShare')}</Badge>
                    <div className="space-y-1.5">
                      <Label>{tSeo('defaultOgImage')}</Label>
                      <ImagePicker
                        value={draft.seo.defaultOgImage}
                        onChange={(defaultOgImage) =>
                          setDraft({
                            ...draft,
                            seo: {
                              ...draft.seo,
                              defaultOgImage: defaultOgImage ?? undefined,
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">{tSeo('defaultOgImageHint')}</p>
                    </div>
                  </section>
                </CardContent>
              </Card>

              <Card className="h-fit lg:sticky lg:top-4">
                <CardHeader>
                  <CardTitle className="text-base">{tSeo('previewTitle')}</CardTitle>
                  <CardDescription>{tSeo('previewHint')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-background p-4 shadow-soft">
                    <p className="truncate text-base font-medium text-[#1a0dab]">{previewTitle}</p>
                    <p className="mt-1 truncate text-xs text-[#006621]" dir="ltr">
                      example.com/store
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {previewDescription}
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>{tSeo('previewNoteTitle')}</li>
                    <li>{tSeo('previewNoteDescription')}</li>
                    <li>{tSeo('previewNoteKeywords')}</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
