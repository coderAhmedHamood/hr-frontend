'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Paintbrush, RotateCcw, Save, ShoppingBag, Upload } from 'lucide-react';
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
import { uploadResponseToStoredPath } from '@/shared/resolve-upload-url';
import { uploadsApi } from '@/features/hr/lib/api/uploads';
import { useWebsiteThemeColors } from '@/features/ecommerce/admin/cms/settings/hooks/use-website-colors';
import {
  CUSTOM_STOREFRONT_FONT_ID,
  DEFAULT_STOREFRONT_BODY_FONT,
  DEFAULT_STOREFRONT_DISPLAY_FONT,
  STOREFRONT_FONT_PRESETS,
  STOREFRONT_GOOGLE_FONT_IDS,
  buildGoogleFontsStylesheetUrl,
  isStorefrontFontId,
  type StorefrontFontId,
} from '@/features/ecommerce/storefront/lib/storefront-fonts';

const PREVIEW_FONTS_HREF = buildGoogleFontsStylesheetUrl([...STOREFRONT_GOOGLE_FONT_IDS]);
const FONT_ACCEPT = '.woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf';

type BrandingState = {
  primaryColor: string;
  secondaryColor: string;
  bodyFont: StorefrontFontId;
  displayFont: StorefrontFontId;
  bodyFontUrl: string | null;
  displayFontUrl: string | null;
};

const DEFAULT_COLORS: Pick<BrandingState, 'primaryColor' | 'secondaryColor'> = {
  primaryColor: '',
  secondaryColor: '',
};

const DEFAULT_FONTS: Pick<
  BrandingState,
  'bodyFont' | 'displayFont' | 'bodyFontUrl' | 'displayFontUrl'
> = {
  bodyFont: DEFAULT_STOREFRONT_BODY_FONT,
  displayFont: DEFAULT_STOREFRONT_DISPLAY_FONT,
  bodyFontUrl: null,
  displayFontUrl: null,
};

const EMPTY_BRANDING: BrandingState = {
  ...DEFAULT_COLORS,
  ...DEFAULT_FONTS,
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
        storefrontBodyFontUrl?: string | null;
        storefrontDisplayFontUrl?: string | null;
      }
    | undefined,
): BrandingState {
  const bodyFont = isStorefrontFontId(input?.storefrontBodyFont)
    ? input.storefrontBodyFont
    : DEFAULT_STOREFRONT_BODY_FONT;
  const displayFont = isStorefrontFontId(input?.storefrontDisplayFont)
    ? input.storefrontDisplayFont
    : DEFAULT_STOREFRONT_DISPLAY_FONT;

  return {
    primaryColor: input?.storefrontPrimaryColor ?? '',
    secondaryColor: input?.storefrontSecondaryColor ?? '',
    bodyFont,
    displayFont,
    bodyFontUrl: input?.storefrontBodyFontUrl ?? null,
    displayFontUrl: input?.storefrontDisplayFontUrl ?? null,
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

function FontUploadField({
  label,
  fileNameHint,
  uploading,
  onUpload,
  onClear,
  hasFile,
}: {
  label: string;
  fileNameHint: string;
  uploading: boolean;
  hasFile: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/20 p-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <p className="text-[11px] text-muted-foreground">{fileNameHint}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-lg"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? '…' : label}
        </Button>
        {hasFile ? (
          <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={onClear}>
            إزالة
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={FONT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onUpload(file);
        }}
      />
    </div>
  );
}

function FontField({
  label,
  value,
  onChange,
  locale,
  customLabel,
}: {
  label: string;
  value: StorefrontFontId;
  onChange: (value: StorefrontFontId) => void;
  locale: string;
  customLabel: string;
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
          <SelectItem value={CUSTOM_STOREFRONT_FONT_ID}>{customLabel}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

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
    bodyFont === CUSTOM_STOREFRONT_FONT_ID
      ? 'system-ui'
      : (STOREFRONT_FONT_PRESETS.find((preset) => preset.id === bodyFont)?.family ??
        'IBM Plex Sans Arabic');
  const displayFamily =
    displayFont === CUSTOM_STOREFRONT_FONT_ID
      ? 'system-ui'
      : (STOREFRONT_FONT_PRESETS.find((preset) => preset.id === displayFont)?.family ?? 'Rubik');

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
  const [uploadingBody, setUploadingBody] = React.useState(false);
  const [uploadingDisplay, setUploadingDisplay] = React.useState(false);

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
    draft.displayFont !== savedRef.current.displayFont ||
    draft.bodyFontUrl !== savedRef.current.bodyFontUrl ||
    draft.displayFontUrl !== savedRef.current.displayFontUrl;

  function patch(next: Partial<BrandingState>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  async function persist(next: BrandingState, successKey: 'saveSuccess' | 'resetColorsSuccess' | 'resetFontsSuccess') {
    if (next.primaryColor.trim() && !isValidHexColor(next.primaryColor)) {
      toast.error(t('colors.invalidPrimary'));
      return false;
    }
    if (next.secondaryColor.trim() && !isValidHexColor(next.secondaryColor)) {
      toast.error(t('colors.invalidSecondary'));
      return false;
    }
    if (next.bodyFont === CUSTOM_STOREFRONT_FONT_ID && !next.bodyFontUrl) {
      toast.error(t('colors.customBodyRequired'));
      return false;
    }
    if (next.displayFont === CUSTOM_STOREFRONT_FONT_ID && !next.displayFontUrl) {
      toast.error(t('colors.customDisplayRequired'));
      return false;
    }

    try {
      const updated = await update.mutateAsync({
        storefrontPrimaryColor: next.primaryColor.trim() || null,
        storefrontSecondaryColor: next.secondaryColor.trim() || null,
        storefrontBodyFont: next.bodyFont,
        storefrontDisplayFont: next.displayFont,
        storefrontBodyFontUrl:
          next.bodyFont === CUSTOM_STOREFRONT_FONT_ID ? next.bodyFontUrl : null,
        storefrontDisplayFontUrl:
          next.displayFont === CUSTOM_STOREFRONT_FONT_ID ? next.displayFontUrl : null,
      });
      const saved = toBrandingState(updated);
      savedRef.current = saved;
      setDraft(saved);
      toast.success(t(`colors.${successKey}`));
      return true;
    } catch {
      toast.error(t('colors.saveError'));
      return false;
    }
  }

  async function handleSave() {
    await persist(draft, 'saveSuccess');
  }

  async function handleResetColors() {
    const next = { ...draft, ...DEFAULT_COLORS };
    setDraft(next);
    await persist(next, 'resetColorsSuccess');
  }

  async function handleResetFonts() {
    const next = { ...draft, ...DEFAULT_FONTS };
    setDraft(next);
    await persist(next, 'resetFontsSuccess');
  }

  async function uploadFont(role: 'body' | 'display', file: File) {
    const setUploading = role === 'body' ? setUploadingBody : setUploadingDisplay;
    setUploading(true);
    try {
      const uploaded = await uploadsApi.upload('other', file);
      const path = uploadResponseToStoredPath(uploaded);
      if (role === 'body') {
        patch({ bodyFont: CUSTOM_STOREFRONT_FONT_ID, bodyFontUrl: path });
      } else {
        patch({ displayFont: CUSTOM_STOREFRONT_FONT_ID, displayFontUrl: path });
      }
      toast.success(t('colors.uploadSuccess'));
    } catch {
      toast.error(t('colors.uploadError'));
    } finally {
      setUploading(false);
    }
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
      {PREVIEW_FONTS_HREF ? <link rel="stylesheet" href={PREVIEW_FONTS_HREF} /> : null}
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('colors.colorsSection')}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-lg"
                disabled={update.isPending}
                onClick={() => void handleResetColors()}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t('colors.resetColors')}
              </Button>
            </div>
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
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('colors.fontsSection')}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-lg"
                disabled={update.isPending}
                onClick={() => void handleResetFonts()}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t('colors.resetFonts')}
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FontField
                label={t('colors.bodyFont')}
                value={draft.bodyFont}
                onChange={(bodyFont) =>
                  patch({
                    bodyFont,
                    bodyFontUrl: bodyFont === CUSTOM_STOREFRONT_FONT_ID ? draft.bodyFontUrl : null,
                  })
                }
                locale={locale}
                customLabel={t('colors.customFont')}
              />
              <FontField
                label={t('colors.displayFont')}
                value={draft.displayFont}
                onChange={(displayFont) =>
                  patch({
                    displayFont,
                    displayFontUrl:
                      displayFont === CUSTOM_STOREFRONT_FONT_ID ? draft.displayFontUrl : null,
                  })
                }
                locale={locale}
                customLabel={t('colors.customFont')}
              />
            </div>
            {draft.bodyFont === CUSTOM_STOREFRONT_FONT_ID ||
            draft.displayFont === CUSTOM_STOREFRONT_FONT_ID ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {draft.bodyFont === CUSTOM_STOREFRONT_FONT_ID ? (
                  <FontUploadField
                    label={t('colors.uploadBodyFont')}
                    fileNameHint={
                      draft.bodyFontUrl
                        ? t('colors.uploadedFile', { file: draft.bodyFontUrl.split('/').pop() ?? '' })
                        : t('colors.uploadHint')
                    }
                    uploading={uploadingBody}
                    hasFile={Boolean(draft.bodyFontUrl)}
                    onUpload={(file) => void uploadFont('body', file)}
                    onClear={() => patch({ bodyFontUrl: null })}
                  />
                ) : null}
                {draft.displayFont === CUSTOM_STOREFRONT_FONT_ID ? (
                  <FontUploadField
                    label={t('colors.uploadDisplayFont')}
                    fileNameHint={
                      draft.displayFontUrl
                        ? t('colors.uploadedFile', {
                            file: draft.displayFontUrl.split('/').pop() ?? '',
                          })
                        : t('colors.uploadHint')
                    }
                    uploading={uploadingDisplay}
                    hasFile={Boolean(draft.displayFontUrl)}
                    onUpload={(file) => void uploadFont('display', file)}
                    onClear={() => patch({ displayFontUrl: null })}
                  />
                ) : null}
              </div>
            ) : null}
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t('colors.fontsHint')}</p>
          </div>
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
    </section>
  );
}
