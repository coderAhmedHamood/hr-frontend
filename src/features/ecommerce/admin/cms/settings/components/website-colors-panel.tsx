'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Paintbrush, RotateCcw, Save, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isValidHexColor } from '@/shared/company-theme';
import { useWebsiteThemeColors } from '@/features/ecommerce/admin/cms/settings/hooks/use-website-colors';
import {
  DEFAULT_STOREFRONT_BODY_FONT,
  DEFAULT_STOREFRONT_DISPLAY_FONT,
  STOREFRONT_FONT_IDS,
  STOREFRONT_FONT_PRESETS,
  buildGoogleFontsStylesheetUrl,
  isStorefrontFontId,
  type StorefrontFontId,
} from '@/features/ecommerce/storefront/lib/storefront-fonts';

const PREVIEW_FONTS_HREF = buildGoogleFontsStylesheetUrl([...STOREFRONT_FONT_IDS]);

type BrandingState = {
  primaryColor: string;
  secondaryColor: string;
  bodyFont: StorefrontFontId;
  displayFont: StorefrontFontId;
};

const EMPTY_BRANDING: BrandingState = {
  primaryColor: '',
  secondaryColor: '',
  bodyFont: DEFAULT_STOREFRONT_BODY_FONT,
  displayFont: DEFAULT_STOREFRONT_DISPLAY_FONT,
};

const DEFAULT_PREVIEW_PRIMARY = '#0f766e';
const DEFAULT_PREVIEW_SECONDARY = '#c9a24b';

function toBrandingState(
  input:
    | {
        storefrontPrimaryColor: string | null;
        storefrontSecondaryColor: string | null;
        storefrontBodyFont?: string | null;
        storefrontDisplayFont?: string | null;
      }
    | undefined,
): BrandingState {
  return {
    primaryColor: input?.storefrontPrimaryColor ?? '',
    secondaryColor: input?.storefrontSecondaryColor ?? '',
    bodyFont: isStorefrontFontId(input?.storefrontBodyFont)
      ? input.storefrontBodyFont
      : DEFAULT_STOREFRONT_BODY_FONT,
    displayFont: isStorefrontFontId(input?.storefrontDisplayFont)
      ? input.storefrontDisplayFont
      : DEFAULT_STOREFRONT_DISPLAY_FONT,
  };
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const pickerValue = isValidHexColor(value) ? value : '#000000';

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-input bg-transparent p-0.5"
          aria-label={label}
        />
        <Input
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-xl font-mono"
          placeholder="#0f766e"
        />
      </div>
    </div>
  );
}

function FontField({
  label,
  value,
  onChange,
  locale,
}: {
  label: string;
  value: StorefrontFontId;
  onChange: (value: StorefrontFontId) => void;
  locale: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as StorefrontFontId)}>
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STOREFRONT_FONT_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <span style={{ fontFamily: `'${preset.family}', system-ui, sans-serif` }}>
                {locale === 'en' ? preset.labelEn : preset.labelAr}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Self-contained mock storefront card — draft colors/fonts only. Never touches the real app theme. */
function StorePreviewMock({
  primaryColor,
  secondaryColor,
  bodyFont,
  displayFont,
  label,
}: {
  primaryColor: string;
  secondaryColor: string;
  bodyFont: StorefrontFontId;
  displayFont: StorefrontFontId;
  label: string;
}) {
  const primary = isValidHexColor(primaryColor) ? primaryColor : DEFAULT_PREVIEW_PRIMARY;
  const secondary = isValidHexColor(secondaryColor) ? secondaryColor : DEFAULT_PREVIEW_SECONDARY;
  const bodyFamily =
    STOREFRONT_FONT_PRESETS.find((preset) => preset.id === bodyFont)?.family ?? 'IBM Plex Sans Arabic';
  const displayFamily =
    STOREFRONT_FONT_PRESETS.find((preset) => preset.id === displayFont)?.family ?? 'Rubik';

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-soft"
        style={{ fontFamily: `'${bodyFamily}', system-ui, sans-serif` }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: primary }}>
          <span
            className="flex items-center gap-2 text-sm font-semibold text-white"
            style={{ fontFamily: `'${displayFamily}', system-ui, sans-serif` }}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            المتجر
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
            style={{ backgroundColor: secondary }}
          >
            عرض خاص
          </span>
        </div>
        <div className="space-y-3 p-4">
          <p
            className="text-base font-semibold text-foreground"
            style={{ fontFamily: `'${displayFamily}', system-ui, sans-serif` }}
          >
            أحدث المنتجات
          </p>
          <p className="text-sm text-muted-foreground">تسوق مجموعة مختارة بعناية لبشرتك.</p>
          <button
            type="button"
            tabIndex={-1}
            className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            أضف إلى السلة
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="w-full rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: secondary, color: secondary }}
          >
            اشترِ الآن
          </button>
        </div>
      </div>
    </div>
  );
}

export function WebsiteColorsPanel({ companyId }: { companyId: string }) {
  const t = useTranslations('ecommerceAdmin.settings');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { company, isLoading, isError, refetch, update } = useWebsiteThemeColors(companyId);

  const [draft, setDraft] = React.useState<BrandingState>(EMPTY_BRANDING);
  const savedRef = React.useRef<BrandingState>(EMPTY_BRANDING);

  React.useEffect(() => {
    if (company) {
      const next = toBrandingState(company);
      setDraft(next);
      savedRef.current = next;
    }
  }, [company]);

  const dirty =
    draft.primaryColor !== savedRef.current.primaryColor ||
    draft.secondaryColor !== savedRef.current.secondaryColor ||
    draft.bodyFont !== savedRef.current.bodyFont ||
    draft.displayFont !== savedRef.current.displayFont;

  function patch(next: Partial<BrandingState>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  async function handleSave() {
    if (draft.primaryColor.trim() && !isValidHexColor(draft.primaryColor)) {
      toast.error(t('colors.invalidPrimary'));
      return;
    }
    if (draft.secondaryColor.trim() && !isValidHexColor(draft.secondaryColor)) {
      toast.error(t('colors.invalidSecondary'));
      return;
    }

    try {
      const updated = await update.mutateAsync({
        storefrontPrimaryColor: draft.primaryColor.trim() || null,
        storefrontSecondaryColor: draft.secondaryColor.trim() || null,
        storefrontBodyFont: draft.bodyFont,
        storefrontDisplayFont: draft.displayFont,
      });
      const next = toBrandingState(updated);
      savedRef.current = next;
      setDraft(next);
      toast.success(t('colors.saveSuccess'));
    } catch {
      toast.error(t('colors.saveError'));
    }
  }

  function handleReset() {
    setDraft(savedRef.current);
  }

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-muted/40" />;
  }

  if (isError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4">
        <p className="text-sm text-destructive">{t('colors.loadError')}</p>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => void refetch()}>
          {tCommon('actions.retry')}
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card">
      {/* Load curated fonts so dropdown + preview render the real families */}
      <link rel="stylesheet" href={PREVIEW_FONTS_HREF} />
      <header className="flex items-start gap-3 border-b border-border/60 px-5 py-4 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Paintbrush className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t('colors.title')}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('colorsHint')}</p>
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_260px] sm:p-6">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              label={t('colors.primaryColor')}
              value={draft.primaryColor}
              onChange={(primaryColor) => patch({ primaryColor })}
            />
            <ColorField
              label={t('colors.secondaryColor')}
              value={draft.secondaryColor}
              onChange={(secondaryColor) => patch({ secondaryColor })}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FontField
              label={t('colors.bodyFont')}
              value={draft.bodyFont}
              onChange={(bodyFont) => patch({ bodyFont })}
              locale={locale}
            />
            <FontField
              label={t('colors.displayFont')}
              value={draft.displayFont}
              onChange={(displayFont) => patch({ displayFont })}
              locale={locale}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t('colors.fontsHint')}</p>
        </div>

        <StorePreviewMock
          primaryColor={draft.primaryColor}
          secondaryColor={draft.secondaryColor}
          bodyFont={draft.bodyFont}
          displayFont={draft.displayFont}
          label={t('colors.previewLabel')}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:px-6">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t('colors.hint')}</p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-xl"
            disabled={!dirty || update.isPending}
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
            {t('colors.reset')}
          </Button>
          <Button
            type="button"
            className="gap-2 rounded-xl"
            disabled={!dirty || update.isPending}
            onClick={() => void handleSave()}
          >
            <Save className="h-4 w-4" />
            {update.isPending ? t('colors.saving') : t('colors.save')}
          </Button>
        </div>
      </div>
    </section>
  );
}
