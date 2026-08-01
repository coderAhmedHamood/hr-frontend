'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  GalleryHorizontal,
  Palette,
  Phone,
  Save,
  Search,
  Settings2,
  Share2,
  Truck,
  Wallet,
} from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  getCmsCompanyRecord,
  saveCmsCompanyRecord,
  saveCmsPageRecord,
} from '@/features/ecommerce/admin/cms/shared/cms-actions';
import {
  COMPANY_SOCIAL_NETWORKS,
  clampAnnouncementSpeedMs,
  DEFAULT_ANNOUNCEMENT_SPEED_MS,
  MAX_ANNOUNCEMENT_SPEED_MS,
  MIN_ANNOUNCEMENT_SPEED_MS,
  normalizeAnnouncementBar,
  normalizeSocialLinks,
  type CompanyConfigRecord,
  type CompanySocialNetwork,
} from '@/features/ecommerce/storefront/domain/company-config';
import { useHomepagePageRecord } from '@/features/ecommerce/admin/cms/homepage/hooks/use-homepage-page';
import { homepageCmsQueryKeys } from '@/features/ecommerce/admin/cms/homepage/hooks/query-keys';
import { createSectionFromDefinition } from '@/features/ecommerce/admin/cms/homepage/lib/create-section';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type { HeroCarouselSectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import { ImagePicker } from '@/features/ecommerce/admin/cms/homepage/components/section-entity-pickers';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/shared/utils';

const SETTINGS_QUERY_KEY = ['ecommerce-cms', 'company', 'settings'] as const;

const DEFAULT_HERO_INTERVAL_MS = 5000;
const MIN_HERO_INTERVAL_MS = 1000;
const MAX_HERO_INTERVAL_MS = 30_000;

function clampHeroIntervalMs(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_HERO_INTERVAL_MS;
  return Math.min(MAX_HERO_INTERVAL_MS, Math.max(MIN_HERO_INTERVAL_MS, Math.round(value!)));
}

const FIELD =
  'h-11 min-h-11 w-full min-w-0 max-w-full rounded-xl border-input bg-background px-3.5 text-sm';

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,،\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function findHero(page: PageRecord | null | undefined): HeroCarouselSectionRecord | null {
  if (!page) return null;
  return (
    page.sections.find(
      (section): section is HeroCarouselSectionRecord => section.type === 'hero-carousel',
    ) ?? null
  );
}

function withHeroInterval(page: PageRecord, intervalMs: number): PageRecord {
  const now = new Date().toISOString();
  const existing = findHero(page);
  const hero =
    existing ??
    (createSectionFromDefinition('hero-carousel', page.sections) as HeroCarouselSectionRecord);
  const nextHero: HeroCarouselSectionRecord = {
    ...hero,
    settings: {
      ...hero.settings,
      autoplay: true,
      intervalMs: clampHeroIntervalMs(intervalMs),
    },
    updatedAt: now,
    revision: hero.revision + 1,
  };
  const sections = page.sections.some((section) => section.id === nextHero.id)
    ? page.sections.map((section) => (section.id === nextHero.id ? nextHero : section))
    : [nextHero, ...page.sections];
  return { ...page, updatedAt: now, sections };
}

function defaultCheckout(draft: CompanyConfigRecord) {
  return (
    draft.checkout ?? {
      cities: [],
      defaultCity: '',
      freeShippingThreshold: 200,
      standardShippingFee: 25,
      paymentMethods: ['cash_on_delivery', 'card'] as Array<'cash_on_delivery' | 'card'>,
    }
  );
}

function SettingsPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border/70 bg-card', className)}>
      <header className="border-b border-border/60 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function WebsiteSettingsPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.settings');
  const tSeo = useTranslations('ecommerceAdmin.seo');
  const tHome = useTranslations('ecommerceAdmin.homepage');
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
        announcement: normalizeAnnouncementBar(record.announcement),
        storePages: {
          offers: record.storePages?.offers !== false,
          wholesale: record.storePages?.wholesale !== false,
        },
        seo: {
          ...record.seo,
          keywords: record.seo.keywords ?? [],
        },
      } satisfies CompanyConfigRecord;
    },
  });

  const {
    data: homepage,
    isLoading: homepageLoading,
    isError: homepageError,
  } = useHomepagePageRecord(companyId);

  const [draft, setDraft] = React.useState<CompanyConfigRecord | null>(null);
  const [heroIntervalMs, setHeroIntervalMs] = React.useState(DEFAULT_HERO_INTERVAL_MS);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (data) {
      setDraft(structuredClone(data));
      setDirty(false);
    }
  }, [data]);

  React.useEffect(() => {
    const hero = findHero(homepage);
    if (hero) setHeroIntervalMs(clampHeroIntervalMs(hero.settings.intervalMs));
  }, [homepage]);

  const save = useMutation({
    mutationFn: async (input: { company: CompanyConfigRecord; intervalMs: number }) => {
      const company = await saveCmsCompanyRecord({
        ...input.company,
        social: normalizeSocialLinks(input.company.social),
        announcement: {
          ...normalizeAnnouncementBar(input.company.announcement),
          speedMs: clampAnnouncementSpeedMs(input.company.announcement.speedMs),
        },
        seo: {
          ...input.company.seo,
          keywords: (input.company.seo.keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean),
        },
      });

      let savedPage: PageRecord | null = null;
      if (homepage) {
        savedPage = await saveCmsPageRecord(withHeroInterval(homepage, input.intervalMs));
      }

      return { company, page: savedPage };
    },
    onSuccess: ({ company, page }) => {
      queryClient.setQueryData([...SETTINGS_QUERY_KEY, companyId], {
        ...company,
        social: normalizeSocialLinks(company.social),
        announcement: normalizeAnnouncementBar(company.announcement),
        seo: { ...company.seo, keywords: company.seo.keywords ?? [] },
      });
      void queryClient.invalidateQueries({ queryKey: ['ecommerce-cms', 'company'] });
      if (page) {
        queryClient.setQueryData(homepageCmsQueryKeys.record(companyId), page);
        void queryClient.invalidateQueries({ queryKey: homepageCmsQueryKeys.all });
        const hero = findHero(page);
        if (hero) setHeroIntervalMs(clampHeroIntervalMs(hero.settings.intervalMs));
      }
      setDraft({
        ...company,
        social: normalizeSocialLinks(company.social),
        announcement: normalizeAnnouncementBar(company.announcement),
        seo: { ...company.seo, keywords: company.seo.keywords ?? [] },
      });
      setDirty(false);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  usePageHeaderActions(
    () => (
      <PageHeaderPrimaryButton
        icon={Save}
        label={save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
        disabled={!draft || save.isPending || !dirty}
        onClick={() => {
          if (draft) {
            void save.mutateAsync({ company: draft, intervalMs: heroIntervalMs });
          }
        }}
      />
    ),
    [draft, dirty, heroIntervalMs, save.isPending, tCommon],
  );

  function updateDraft(next: CompanyConfigRecord) {
    setDraft(next);
    setDirty(true);
  }

  function patchSeo(
    path: 'homeTitle' | 'homeDescription' | 'productsTitle' | 'productsDescription',
    value: string,
  ) {
    if (!draft) return;
    updateDraft({
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
    updateDraft({
      ...draft,
      social: {
        ...draft.social,
        [network]: {
          url: patch.url ?? current.url,
          enabled: patch.enabled ?? current.enabled,
        },
      },
    });
  }

  function patchAnnouncement(
    patch: Partial<CompanyConfigRecord['announcement']>,
  ) {
    if (!draft) return;
    updateDraft({
      ...draft,
      announcement: {
        ...normalizeAnnouncementBar(draft.announcement),
        ...patch,
      },
    });
  }

  const keywordsText = (draft?.seo.keywords ?? []).join('، ');
  const previewTitle = draft?.seo.homeTitle.ar.trim() || tSeo('previewTitleEmpty');
  const previewDescription = draft?.seo.homeDescription.ar.trim() || tSeo('previewDescriptionEmpty');
  const announcement = draft ? normalizeAnnouncementBar(draft.announcement) : null;
  const hasHero = Boolean(findHero(homepage));

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="Settings" />

      <section className="rounded-2xl border border-border/70 bg-linear-to-l from-primary/6 via-card to-card px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{t('studioTitle')}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('studioHint')}</p>
          </div>
        </div>
      </section>

      {dirty ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-warning">
          {tHome('unsavedHint')}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-11 w-full max-w-xl animate-pulse rounded-xl bg-muted/50" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
        </div>
      ) : null}

      {isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4">
          <p className="text-sm text-destructive">{t('loadError')}</p>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void refetch()}>
            {tCommon('actions.retry')}
          </Button>
        </div>
      ) : null}

      {draft && announcement ? (
        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-border/70 bg-muted/30 p-1.5">
            {(
              [
                ['branding', Palette, t('tabs.branding')],
                ['bars', GalleryHorizontal, t('tabs.bars')],
                ['contact', Phone, t('tabs.contact')],
                ['social', Share2, t('tabs.social')],
                ['checkout', Truck, t('tabs.checkout')],
                ['seo', Search, t('tabs.seo')],
              ] as const
            ).map(([value, Icon, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 rounded-xl px-3 py-2 data-[state=active]:bg-card data-[state=active]:shadow-soft"
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="branding" className="mt-4">
            <SettingsPanel title={t('tabs.branding')} description={t('brandingHint')}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('name')} className="sm:col-span-2">
                  <Input
                    className={FIELD}
                    value={draft.name.ar}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateDraft({ ...draft, name: { ar: value, en: value } });
                    }}
                  />
                </Field>
                <Field label={t('logo')} hint={t('logoHint')}>
                  <ImagePicker
                    value={draft.logoUrl}
                    onChange={(logoUrl) => updateDraft({ ...draft, logoUrl })}
                  />
                </Field>
                <Field label={t('favicon')} hint={t('faviconHint')}>
                  <ImagePicker
                    value={draft.faviconUrl}
                    onChange={(faviconUrl) => updateDraft({ ...draft, faviconUrl })}
                  />
                </Field>
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="bars" className="mt-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('bars.announcementTitle')}</CardTitle>
                  <CardDescription>{t('bars.announcementDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/70 border-t border-border/70">
                    <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-medium text-foreground">
                        {t('bars.announcementEnabled')}
                      </p>
                      <Switch
                        checked={announcement.enabled}
                        onCheckedChange={(enabled) => patchAnnouncement({ enabled })}
                      />
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
                      <div className="min-w-0 space-y-0.5">
                        <Label htmlFor="settings-announcement-speed" className="text-sm font-medium">
                          {t('bars.speedMs')}
                        </Label>
                        <p className="text-[11px] text-muted-foreground">{t('bars.speedMsHint')}</p>
                      </div>
                      <Input
                        id="settings-announcement-speed"
                        dir="ltr"
                        type="number"
                        min={MIN_ANNOUNCEMENT_SPEED_MS}
                        max={MAX_ANNOUNCEMENT_SPEED_MS}
                        step={500}
                        className="w-full font-mono text-sm sm:w-40"
                        value={announcement.speedMs}
                        placeholder={t('bars.speedMsPlaceholder')}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === '') {
                            patchAnnouncement({ speedMs: DEFAULT_ANNOUNCEMENT_SPEED_MS });
                            return;
                          }
                          const parsed = Number(raw);
                          if (!Number.isFinite(parsed)) return;
                          patchAnnouncement({ speedMs: Math.round(parsed) });
                        }}
                        onBlur={() =>
                          patchAnnouncement({
                            speedMs: clampAnnouncementSpeedMs(announcement.speedMs),
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{t('bars.dismissible')}</p>
                        <p className="text-xs text-muted-foreground">{t('bars.dismissibleHint')}</p>
                      </div>
                      <Switch
                        checked={announcement.dismissible}
                        onCheckedChange={(dismissible) => patchAnnouncement({ dismissible })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('bars.heroTitle')}</CardTitle>
                  <CardDescription>{t('bars.heroDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {homepageLoading ? (
                    <div className="border-t border-border/70 px-4 py-3.5 sm:px-6">
                      <div className="h-12 animate-pulse rounded-lg bg-muted/50" />
                    </div>
                  ) : homepageError || !homepage ? (
                    <p className="border-t border-border/70 px-4 py-3.5 text-sm text-muted-foreground sm:px-6">
                      {t('bars.heroMissing')}
                    </p>
                  ) : (
                    <div className="divide-y divide-border/70 border-t border-border/70">
                      <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
                        <div className="min-w-0 space-y-0.5">
                          <Label htmlFor="settings-hero-interval" className="text-sm font-medium">
                            {t('bars.heroIntervalMs')}
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            {t('bars.heroIntervalMsHint')}
                          </p>
                          {!hasHero ? (
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              {t('bars.heroMissing')}
                            </p>
                          ) : null}
                        </div>
                        <Input
                          id="settings-hero-interval"
                          dir="ltr"
                          type="number"
                          min={MIN_HERO_INTERVAL_MS}
                          max={MAX_HERO_INTERVAL_MS}
                          step={500}
                          className="w-full font-mono text-sm sm:w-40"
                          value={heroIntervalMs}
                          placeholder={t('bars.heroIntervalMsPlaceholder')}
                          disabled={!hasHero && !homepage}
                          onChange={(event) => {
                            const raw = event.target.value;
                            if (raw === '') {
                              setHeroIntervalMs(DEFAULT_HERO_INTERVAL_MS);
                              return;
                            }
                            const parsed = Number(raw);
                            if (!Number.isFinite(parsed)) return;
                            setHeroIntervalMs(Math.round(parsed));
                          }}
                          onBlur={() => setHeroIntervalMs((value) => clampHeroIntervalMs(value))}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-4">
            <SettingsPanel title={t('tabs.contact')} description={t('contactHint')}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('phone')}>
                  <Input
                    dir="ltr"
                    className={cn(FIELD, 'text-right')}
                    value={draft.contact.phone ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        contact: { ...draft.contact, phone: event.target.value },
                      })
                    }
                  />
                </Field>
                <Field label={t('email')}>
                  <Input
                    dir="ltr"
                    className={cn(FIELD, 'text-right')}
                    value={draft.contact.email ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        contact: { ...draft.contact, email: event.target.value },
                      })
                    }
                  />
                </Field>
                <Field label={t('address')} className="sm:col-span-2">
                  <Input
                    className={FIELD}
                    value={draft.contact.address ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        contact: { ...draft.contact, address: event.target.value },
                      })
                    }
                  />
                </Field>
                <Field
                  label={t('commercialRegistration')}
                  hint={t('commercialRegistrationHint')}
                  className="sm:col-span-2"
                >
                  <Input
                    className={FIELD}
                    value={draft.footer.commercialRegistration ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        footer: {
                          ...draft.footer,
                          commercialRegistration: event.target.value || undefined,
                        },
                      })
                    }
                  />
                </Field>
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <SettingsPanel title={t('tabs.social')} description={t('socialHint')}>
              <div className="space-y-3">
                {COMPANY_SOCIAL_NETWORKS.map((network) => {
                  const entry = draft.social[network] ?? { url: '', enabled: false };
                  return (
                    <div
                      key={network}
                      className="grid gap-3 rounded-2xl border border-border/60 bg-muted/15 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                    >
                      <Field label={t(network)}>
                        <Input
                          dir="ltr"
                          className={cn(FIELD, 'font-mono')}
                          placeholder={t('socialUrlPlaceholder')}
                          value={entry.url}
                          onChange={(event) => patchSocial(network, { url: event.target.value })}
                        />
                      </Field>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-3 py-2.5 sm:min-w-40">
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
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="checkout" className="mt-4">
            <SettingsPanel title={t('tabs.checkout')} description={t('checkoutHint')}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('freeShippingThreshold')}>
                  <Input
                    type="number"
                    min={0}
                    dir="ltr"
                    className={FIELD}
                    value={draft.checkout?.freeShippingThreshold ?? 200}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        checkout: {
                          ...defaultCheckout(draft),
                          freeShippingThreshold: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </Field>
                <Field label={t('standardShippingFee')}>
                  <Input
                    type="number"
                    min={0}
                    dir="ltr"
                    className={FIELD}
                    value={draft.checkout?.standardShippingFee ?? 25}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        checkout: {
                          ...defaultCheckout(draft),
                          standardShippingFee: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </Field>
                <Field label={t('defaultCity')}>
                  <Input
                    className={FIELD}
                    value={draft.checkout?.defaultCity ?? ''}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        checkout: {
                          ...defaultCheckout(draft),
                          defaultCity: event.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <Field label={t('cities')} hint={t('citiesHint')} className="sm:col-span-2">
                  <Textarea
                    rows={4}
                    className="min-h-28 rounded-xl"
                    value={(draft.checkout?.cities ?? []).join('\n')}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        checkout: {
                          ...defaultCheckout(draft),
                          cities: event.target.value
                            .split('\n')
                            .map((city) => city.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </Field>
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-sm font-medium text-foreground">{t('paymentMethods')}</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ['cash_on_delivery', t('paymentCod'), Wallet],
                        ['card', t('paymentCard'), CreditCard],
                      ] as const
                    ).map(([id, label, Icon]) => {
                      const checked = (draft.checkout?.paymentMethods ?? []).includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            const current = draft.checkout?.paymentMethods ?? [];
                            const paymentMethods = checked
                              ? current.filter((method) => method !== id)
                              : [...current.filter((method) => method !== id), id];
                            updateDraft({
                              ...draft,
                              checkout: {
                                ...defaultCheckout(draft),
                                paymentMethods: paymentMethods.length > 0 ? paymentMethods : [id],
                              },
                            });
                          }}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-colors',
                            checked
                              ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                              : 'border-border/70 bg-muted/10 hover:border-primary/25',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-xl',
                              checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary',
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{label}</span>
                          <Switch checked={checked} tabIndex={-1} aria-hidden />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SettingsPanel>
          </TabsContent>

          <TabsContent value="seo" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <SettingsPanel title={t('tabs.seo')} description={tSeo('formHint')}>
                <div className="grid gap-5">
                  <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <Badge variant="subtle">{tSeo('sectionHome')}</Badge>
                    <Field label={tSeo('homeTitle')} hint={tSeo('homeTitleHint')}>
                      <Input
                        className={FIELD}
                        value={draft.seo.homeTitle.ar}
                        maxLength={70}
                        onChange={(event) => patchSeo('homeTitle', event.target.value)}
                      />
                    </Field>
                    <Field label={tSeo('homeDescription')} hint={tSeo('homeDescriptionHint')}>
                      <Textarea
                        rows={3}
                        className="rounded-xl"
                        value={draft.seo.homeDescription.ar}
                        maxLength={170}
                        onChange={(event) => patchSeo('homeDescription', event.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <Badge variant="subtle">{tSeo('sectionKeywords')}</Badge>
                    <Field label={tSeo('keywords')} hint={tSeo('keywordsHint')}>
                      <Textarea
                        rows={3}
                        className="rounded-xl"
                        value={keywordsText}
                        placeholder={tSeo('keywordsPlaceholder')}
                        onChange={(event) =>
                          updateDraft({
                            ...draft,
                            seo: {
                              ...draft.seo,
                              keywords: parseKeywords(event.target.value),
                            },
                          })
                        }
                      />
                    </Field>
                    {(draft.seo.keywords ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(draft.seo.keywords ?? []).map((keyword) => (
                          <Badge key={keyword} variant="subtle">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <Badge variant="subtle">{tSeo('sectionProducts')}</Badge>
                    <Field label={tSeo('productsTitle')} hint={tSeo('productsTitleHint')}>
                      <Input
                        className={FIELD}
                        value={draft.seo.productsTitle.ar}
                        maxLength={70}
                        onChange={(event) => patchSeo('productsTitle', event.target.value)}
                      />
                    </Field>
                    <Field label={tSeo('productsDescription')} hint={tSeo('productsDescriptionHint')}>
                      <Textarea
                        rows={3}
                        className="rounded-xl"
                        value={draft.seo.productsDescription.ar}
                        maxLength={170}
                        onChange={(event) => patchSeo('productsDescription', event.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <Badge variant="subtle">{tSeo('sectionShare')}</Badge>
                    <Field label={tSeo('defaultOgImage')} hint={tSeo('defaultOgImageHint')}>
                      <ImagePicker
                        value={draft.seo.defaultOgImage}
                        onChange={(defaultOgImage) =>
                          updateDraft({
                            ...draft,
                            seo: {
                              ...draft.seo,
                              defaultOgImage: defaultOgImage ?? undefined,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              </SettingsPanel>

              <aside className="h-fit rounded-2xl border border-border/70 bg-card lg:sticky lg:top-4">
                <header className="border-b border-border/60 px-5 py-4">
                  <h3 className="text-sm font-semibold text-foreground">{tSeo('previewTitle')}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{tSeo('previewHint')}</p>
                </header>
                <div className="space-y-4 p-5">
                  <div className="rounded-xl border border-border bg-background p-4 shadow-soft">
                    <p className="truncate text-base font-medium text-[#1a0dab]">{previewTitle}</p>
                    <p className="mt-1 truncate text-xs text-[#006621]" dir="ltr">
                      example.com/store
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {previewDescription}
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                    <li>{tSeo('previewNoteTitle')}</li>
                    <li>{tSeo('previewNoteDescription')}</li>
                    <li>{tSeo('previewNoteKeywords')}</li>
                  </ul>
                </div>
              </aside>
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
