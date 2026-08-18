'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImageOff,
  Pencil,
  Play,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontPublicHomeHref } from '@/features/ecommerce/storefront/lib/store-paths';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type {
  HeroCarouselSectionRecord,
  HeroCarouselSlideRecord,
  SectionRecord,
} from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import type { StorefrontHeroSlide } from '@/features/ecommerce/storefront/domain/storefront-models';
import { HeroCarousel } from '@/features/ecommerce/storefront/components/catalog/hero-carousel';
import { resolveStorefrontImageSrc } from '@/features/ecommerce/storefront/lib/resolve-storefront-image-src';
import { useHomepagePageRecord } from '@/features/ecommerce/admin/cms/homepage/hooks/use-homepage-page';
import { useHomepagePageMutations } from '@/features/ecommerce/admin/cms/homepage/hooks/use-homepage-mutations';
import { createSectionFromDefinition } from '@/features/ecommerce/admin/cms/homepage/lib/create-section';
import { ImagePicker } from '@/features/ecommerce/admin/cms/homepage/components/section-entity-pickers';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEFAULT_INTERVAL_MS = 5000;
const MIN_INTERVAL_MS = 1000;
const MAX_INTERVAL_MS = 30_000;

function clampIntervalMs(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_INTERVAL_MS;
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, Math.round(value!)));
}

function isSlideEnabled(slide: HeroCarouselSlideRecord): boolean {
  return slide.enabled !== false;
}

function findOrCreateHero(page: PageRecord): { page: PageRecord; hero: HeroCarouselSectionRecord } {
  const existing = page.sections.find(
    (section): section is HeroCarouselSectionRecord => section.type === 'hero-carousel',
  );
  if (existing) return { page, hero: existing };
  const hero = createSectionFromDefinition('hero-carousel', page.sections) as HeroCarouselSectionRecord;
  return {
    page: {
      ...page,
      sections: [hero, ...page.sections],
    },
    hero,
  };
}

function createEmptySlide(): HeroCarouselSlideRecord {
  return {
    id: crypto.randomUUID(),
    imageUrl: '',
    enabled: true,
    title: { ar: '', en: '' },
  };
}

function normalizeSlide(slide: HeroCarouselSlideRecord): HeroCarouselSlideRecord {
  const titleAr = slide.title?.ar?.trim() ?? '';
  return {
    id: slide.id,
    imageUrl: slide.imageUrl,
    enabled: isSlideEnabled(slide),
    title: titleAr ? { ar: titleAr, en: slide.title?.en?.trim() || titleAr } : undefined,
  };
}

function toPreviewSlides(slides: HeroCarouselSlideRecord[]): StorefrontHeroSlide[] {
  return slides
    .filter(isSlideEnabled)
    .map((slide) => {
      const title = slide.title?.ar?.trim() ?? '';
      const imageUrl = resolveStorefrontImageSrc(slide.imageUrl) ?? '';
      const mobileImageUrl = resolveStorefrontImageSrc(slide.mobileImageUrl);
      return {
        id: slide.id,
        imageUrl,
        mobileImageUrl,
        title,
        alt: title || 'Banner',
        href: slide.href ?? null,
      };
    })
    .filter((slide) => slide.imageUrl || slide.mobileImageUrl);
}

type SlideFormState = {
  open: boolean;
  index: number | null;
  draft: HeroCarouselSlideRecord;
};

export function HeroCarouselPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.banners');
  const tHome = useTranslations('ecommerceAdmin.homepage');
  const tCommon = useTranslations('common');

  const { data, isLoading, isError, refetch } = useHomepagePageRecord(companyId);
  const { save } = useHomepagePageMutations(companyId);

  const [draft, setDraft] = React.useState<PageRecord | null>(null);
  const [heroDraft, setHeroDraft] = React.useState<HeroCarouselSectionRecord | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [form, setForm] = React.useState<SlideFormState | null>(null);
  const [toDeleteIndex, setToDeleteIndex] = React.useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    // Never clobber in-progress edits when a background query updates.
    if (dirty) return;
    const hadHero = data.sections.some((section) => section.type === 'hero-carousel');
    const { page, hero } = findOrCreateHero(structuredClone(data));
    setDraft(page);
    setHeroDraft({
      ...hero,
      content: {
        ...hero.content,
        slides: hero.content.slides.map(normalizeSlide),
      },
    });
    setDirty(!hadHero);
  }, [data, dirty]);

  const slides = heroDraft?.content.slides ?? [];
  const previewSlides = toPreviewSlides(slides);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          disabled={!heroDraft || previewSlides.length === 0}
          onClick={() => setPreviewOpen(true)}
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('previewAutoplay')}</span>
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8" asChild>
          <Link href={storefrontPublicHomeHref()} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tHome('previewStorefront')}</span>
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8"
          disabled={!heroDraft}
          onClick={() =>
            setForm({
              open: true,
              index: null,
              draft: createEmptySlide(),
            })
          }
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('addSlide')}</span>
        </Button>
        <PageHeaderPrimaryButton
          icon={Save}
          label={save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
          disabled={!draft || !heroDraft || save.isPending || !dirty}
          onClick={() => void persist()}
        />
      </div>
    ),
    [draft, heroDraft, dirty, save.isPending, previewSlides.length, t, tHome, tCommon],
  );

  function updateHero(next: HeroCarouselSectionRecord) {
    setHeroDraft(next);
    setDirty(true);
  }

  function updateSlides(nextSlides: HeroCarouselSlideRecord[]) {
    if (!heroDraft) return;
    updateHero({ ...heroDraft, content: { ...heroDraft.content, slides: nextSlides } });
  }

  function setSlideEnabled(index: number, enabled: boolean) {
    const next = [...slides];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, enabled };
    updateSlides(next);
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= slides.length) return;
    const next = [...slides];
    const current = next[index];
    const swap = next[swapIndex];
    if (!current || !swap) return;
    next[index] = swap;
    next[swapIndex] = current;
    updateSlides(next);
  }

  function saveSlideForm() {
    if (!form) return;
    const nextSlide = normalizeSlide(form.draft);
    if (!nextSlide.imageUrl.trim()) return;
    const nextSlides =
      form.index === null
        ? [...slides, nextSlide]
        : slides.map((slide, index) => (index === form.index ? nextSlide : slide));
    if (!heroDraft || !draft) return;

    const now = new Date().toISOString();
    const nextHero: HeroCarouselSectionRecord = {
      ...heroDraft,
      content: { ...heroDraft.content, slides: nextSlides },
      updatedAt: now,
    };
    setHeroDraft(nextHero);
    setForm(null);
    setDirty(true);

    // Persist immediately — dialog "حفظ" should write to the store API, not only local draft.
    void persistWithHero(nextHero);
  }

  async function persistWithHero(nextHeroInput: HeroCarouselSectionRecord) {
    if (!draft) return;
    const now = new Date().toISOString();
    const nextHero: SectionRecord = {
      ...nextHeroInput,
      enabled: true,
      content: {
        ...nextHeroInput.content,
        slides: nextHeroInput.content.slides.map(normalizeSlide),
      },
      settings: {
        autoplay: true,
        intervalMs: clampIntervalMs(nextHeroInput.settings.intervalMs),
      },
      updatedAt: now,
      revision: nextHeroInput.revision + 1,
      status: 'published',
      publishedAt: nextHeroInput.publishedAt ?? now,
    };
    const nextPage: PageRecord = {
      ...draft,
      status: 'published',
      updatedAt: now,
      publishedAt: draft.publishedAt ?? now,
      sections: draft.sections.some((section) => section.id === nextHero.id)
        ? draft.sections.map((section) => (section.id === nextHero.id ? nextHero : section))
        : [nextHero, ...draft.sections],
    };
    try {
      const saved = await save.mutateAsync(nextPage);
      const { page, hero } = findOrCreateHero(structuredClone(saved));
      setDraft(page);
      setHeroDraft({
        ...hero,
        content: {
          ...hero.content,
          slides: hero.content.slides.map(normalizeSlide),
        },
      });
      setDirty(false);
    } catch {
      // Error toast is handled by the mutation.
    }
  }

  async function persist() {
    if (!heroDraft) return;
    await persistWithHero(heroDraft);
  }

  const columns: ColumnDef<HeroCarouselSlideRecord>[] = [
    {
      key: 'image',
      title: t('columnImage'),
      render: (slide) =>
        slide.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.imageUrl}
            alt=""
            className={`h-12 w-20 rounded-md border border-border object-cover ${
              isSlideEnabled(slide) ? '' : 'opacity-45'
            }`}
          />
        ) : (
          <div className="flex h-12 w-20 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
            <ImageOff className="h-4 w-4" />
          </div>
        ),
    },
    {
      key: 'description',
      title: t('columnDescription'),
      render: (slide) => (
        <span
          className={`line-clamp-2 text-sm font-medium ${
            isSlideEnabled(slide) ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {slide.title?.ar?.trim() || t('noDescription')}
        </span>
      ),
    },
    {
      key: 'status',
      title: t('columnStatus'),
      render: (slide) => {
        const index = slides.findIndex((item) => item.id === slide.id);
        const enabled = isSlideEnabled(slide);
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={(next) => setSlideEnabled(index, next)}
              aria-label={enabled ? tHome('enabled') : tHome('disabled')}
            />
            <span className="text-xs text-muted-foreground">
              {enabled ? tHome('enabled') : tHome('disabled')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'order',
      title: t('columnOrder'),
      render: (slide) => {
        const index = slides.findIndex((item) => item.id === slide.id);
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index <= 0}
              onClick={() => moveSlide(index, -1)}
              aria-label={tHome('moveUp')}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center tabular-nums text-xs text-muted-foreground">{index + 1}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index < 0 || index >= slides.length - 1}
              onClick={() => moveSlide(index, 1)}
              aria-label={tHome('moveDown')}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (slide) => {
        const index = slides.findIndex((item) => item.id === slide.id);
        return (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tCommon('actions.edit')}
              onClick={() =>
                setForm({
                  open: true,
                  index,
                  draft: structuredClone(slide),
                })
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tCommon('actions.delete')}
              onClick={() => setToDeleteIndex(index)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="Image" />

      {dirty ? (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {tHome('unsavedHint')}
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

      {heroDraft ? (
        <Card>
          <CardContent className="grid gap-2 py-4 sm:max-w-md">
            <Label htmlFor="hero-interval-ms">{t('intervalMs')}</Label>
            <Input
              id="hero-interval-ms"
              dir="ltr"
              type="number"
              min={MIN_INTERVAL_MS}
              max={MAX_INTERVAL_MS}
              step={500}
              className="font-mono text-sm"
              value={heroDraft.settings.intervalMs || DEFAULT_INTERVAL_MS}
              placeholder={t('intervalMsPlaceholder')}
              onChange={(event) => {
                const raw = event.target.value;
                const parsed = raw === '' ? DEFAULT_INTERVAL_MS : Number(raw);
                if (!Number.isFinite(parsed)) return;
                setHeroDraft({
                  ...heroDraft,
                  settings: {
                    ...heroDraft.settings,
                    autoplay: true,
                    intervalMs: Math.round(parsed),
                  },
                });
                setDirty(true);
              }}
              onBlur={() => {
                setHeroDraft({
                  ...heroDraft,
                  settings: {
                    ...heroDraft.settings,
                    autoplay: true,
                    intervalMs: clampIntervalMs(heroDraft.settings.intervalMs),
                  },
                });
              }}
            />
            <p className="text-[11px] text-muted-foreground">{t('intervalMsHint')}</p>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={slides}
        keyExtractor={(slide) => slide.id}
        loading={isLoading}
        emptyText={t('empty')}
        alwaysShowTable
      />

      <Dialog
        open={Boolean(form?.open)}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form?.index === null ? t('addSlide') : t('editSlide')}
            </DialogTitle>
          </DialogHeader>

          {form ? (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label>{t('columnImage')}</Label>
                <ImagePicker
                  value={form.draft.imageUrl}
                  onChange={(imageUrl) =>
                    setForm({
                      ...form,
                      draft: { ...form.draft, imageUrl: imageUrl ?? '' },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hero-slide-description">{t('columnDescription')}</Label>
                <Input
                  id="hero-slide-description"
                  value={form.draft.title?.ar ?? ''}
                  placeholder={t('descriptionPlaceholder')}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      draft: {
                        ...form.draft,
                        title: {
                          ar: event.target.value,
                          en: form.draft.title?.en || event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <Label htmlFor="hero-slide-enabled" className="text-sm">
                  {isSlideEnabled(form.draft) ? tHome('enabled') : tHome('disabled')}
                </Label>
                <Switch
                  id="hero-slide-enabled"
                  checked={isSlideEnabled(form.draft)}
                  onCheckedChange={(enabled) =>
                    setForm({
                      ...form,
                      draft: { ...form.draft, enabled },
                    })
                  }
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!form?.draft.imageUrl.trim() || save.isPending}
              onClick={saveSlideForm}
            >
              {save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('previewTitle')}</DialogTitle>
          </DialogHeader>
          {previewSlides.length > 0 ? (
            <HeroCarousel
              slides={previewSlides}
              autoplay
              intervalMs={heroDraft?.settings.intervalMs || DEFAULT_INTERVAL_MS}
              layout="contained"
              heightRatio={heroDraft?.style.height || '21/7'}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('previewEmpty')}</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={toDeleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setToDeleteIndex(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('removeSlideTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('removeSlideDescription')}</p>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setToDeleteIndex(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={save.isPending}
              onClick={() => {
                if (toDeleteIndex === null || !heroDraft) return;
                const nextSlides = slides.filter((_, index) => index !== toDeleteIndex);
                const nextHero: HeroCarouselSectionRecord = {
                  ...heroDraft,
                  content: { ...heroDraft.content, slides: nextSlides },
                };
                setHeroDraft(nextHero);
                setToDeleteIndex(null);
                setDirty(true);
                void persistWithHero(nextHero);
              }}
            >
              {tCommon('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
