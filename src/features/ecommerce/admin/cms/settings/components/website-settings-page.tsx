'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Palette, Phone, Share2, Globe, Search, Truck } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { getCmsCompanyRecord, saveCmsCompanyRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SETTINGS_QUERY_KEY = ['ecommerce-cms', 'company', 'settings'] as const;

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
      return record;
    },
  });

  const [draft, setDraft] = React.useState<CompanyConfigRecord | null>(null);
  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (record: CompanyConfigRecord) => saveCmsCompanyRecord(record),
    onSuccess: (saved) => {
      queryClient.setQueryData([...SETTINGS_QUERY_KEY, companyId], saved);
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      setDraft(saved);
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

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} iconName="Settings" />

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" disabled={!draft || save.isPending} onClick={() => draft && void save.mutateAsync(draft)}>
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
            <TabsTrigger value="regional" className="gap-1.5">
              <Globe className="h-4 w-4" />
              {t('tabs.regional')}
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
              <CardContent className="grid gap-4 sm:grid-cols-2">
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
                  <Label>{t('logoUrl')}</Label>
                  <Input
                    value={draft.logoUrl ?? ''}
                    onChange={(event) => setDraft({ ...draft, logoUrl: event.target.value || null })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('faviconUrl')}</Label>
                  <Input
                    value={draft.faviconUrl ?? ''}
                    onChange={(event) => setDraft({ ...draft, faviconUrl: event.target.value || null })}
                  />
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
                        footer: { ...draft.footer, commercialRegistration: event.target.value || undefined },
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
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {(['instagram', 'twitter', 'facebook', 'whatsapp'] as const).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{t(key)}</Label>
                    <Input
                      value={draft.social[key] ?? ''}
                      onChange={(event) =>
                        setDraft({ ...draft, social: { ...draft.social, [key]: event.target.value } })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regional" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tabs.regional')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('currency')}</Label>
                  <Input
                    value={draft.currency}
                    onChange={(event) => setDraft({ ...draft, currency: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('timezone')}</Label>
                  <Input
                    value={draft.timezone}
                    onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('defaultLocale')}</Label>
                  <Select
                    value={draft.defaultLocale}
                    onValueChange={(defaultLocale) => setDraft({ ...draft, defaultLocale })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">ar</SelectItem>
                      <SelectItem value="en">en</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                                ? [...current.filter((m) => m !== id), id]
                                : current.filter((m) => m !== id);
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
                                  paymentMethods:
                                    paymentMethods.length > 0 ? paymentMethods : [id],
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tabs.seo')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {(
                  [
                    ['homeTitle', 'homeTitle', false],
                    ['homeDescription', 'homeDescription', true],
                    ['productsTitle', 'productsTitle', false],
                    ['productsDescription', 'productsDescription', true],
                  ] as const
                ).map(([key, labelKey, multiline]) => {
                  const value = draft.seo[key];
                  const Field = multiline ? Textarea : Input;
                  return (
                    <div key={key} className="space-y-1.5">
                      <Label>{tSeo(labelKey)}</Label>
                      <Field
                        value={value.ar}
                        onChange={(event) => patchSeo(key, event.target.value)}
                      />
                    </div>
                  );
                })}
                <div className="space-y-1.5">
                  <Label>{tSeo('defaultOgImage')}</Label>
                  <Input
                    value={draft.seo.defaultOgImage ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, seo: { ...draft.seo, defaultOgImage: event.target.value } })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
