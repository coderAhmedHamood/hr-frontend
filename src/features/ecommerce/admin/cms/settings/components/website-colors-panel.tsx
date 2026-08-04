'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Paintbrush, RotateCcw, ShoppingBag, Upload } from 'lucide-react';
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
import { hexToHslChannels, hslChannelsToHex, isValidHexColor } from '@/shared/company-theme';
import { uploadResponseToStoredPath } from '@/shared/resolve-upload-url';
import { uploadsApi } from '@/features/hr/lib/api/uploads';
import type { CompanyThemeColors } from '@/features/ecommerce/storefront/domain/company-config';
import {
  CUSTOM_STOREFRONT_FONT_ID,
  DEFAULT_STOREFRONT_BODY_FONT,
  DEFAULT_STOREFRONT_DISPLAY_FONT,
  DEFAULT_STOREFRONT_TYPOGRAPHY,
  STOREFRONT_FONT_PRESETS,
  STOREFRONT_GOOGLE_FONT_IDS,
  buildGoogleFontsStylesheetUrl,
  isStorefrontFontId,
  type StorefrontFontId,
  type StorefrontTypography,
} from '@/features/ecommerce/storefront/lib/storefront-fonts';
import { toast } from 'sonner';

const PREVIEW_FONTS_HREF = buildGoogleFontsStylesheetUrl([...STOREFRONT_GOOGLE_FONT_IDS]);
const FONT_ACCEPT = '.woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf';

const DEFAULT_THEME: CompanyThemeColors = {
  primary: '160 40% 28%',
  secondary: '30 50% 50%',
  accent: '200 40% 40%',
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
          value={value || '#0f766e'}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          value={value}
          className="h-11 rounded-xl font-mono text-sm"
          onChange={(event) => onChange(event.target.value)}
          placeholder="#0f766e"
        />
      </div>
    </div>
  );
}

export function WebsiteColorsPanel({
  theme,
  typography,
  onChange,
}: {
  theme: CompanyThemeColors;
  typography: StorefrontTypography;
  onChange: (next: { theme: CompanyThemeColors; typography: StorefrontTypography }) => void;
}) {
  const t = useTranslations('ecommerceAdmin.settings');
  const locale = useLocale();
  const primaryHex = hslChannelsToHex(theme.primary) ?? '#0f766e';
  const secondaryHex = hslChannelsToHex(theme.secondary) ?? '#c9a24b';

  function setPrimaryHex(hex: string) {
    if (!isValidHexColor(hex)) return;
    const primary = hexToHslChannels(hex);
    if (!primary) return;
    onChange({
      theme: { ...theme, primary, accent: theme.accent || primary },
      typography,
    });
  }

  function setSecondaryHex(hex: string) {
    if (!isValidHexColor(hex)) return;
    const secondary = hexToHslChannels(hex);
    if (!secondary) return;
    onChange({ theme: { ...theme, secondary }, typography });
  }

  function setTypography(next: Partial<StorefrontTypography>) {
    onChange({ theme, typography: { ...typography, ...next } });
  }

  async function uploadFont(role: 'body' | 'display', file: File) {
    try {
      const uploaded = await uploadsApi.upload('other', file);
      const path = uploadResponseToStoredPath(uploaded);
      if (role === 'body') {
        setTypography({
          bodyFontId: CUSTOM_STOREFRONT_FONT_ID,
          bodyFontUrl: path,
        });
      } else {
        setTypography({
          displayFontId: CUSTOM_STOREFRONT_FONT_ID,
          displayFontUrl: path,
        });
      }
      toast.success(t('colors.uploadSuccess'));
    } catch {
      toast.error(t('colors.uploadError'));
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
      {PREVIEW_FONTS_HREF ? <link rel="stylesheet" href={PREVIEW_FONTS_HREF} /> : null}

      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Paintbrush className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{t('colors.title')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('colorsHint')}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t('colors.colorsSection')}</h3>
          <ColorField
            label={t('colors.primaryColor')}
            value={primaryHex}
            onChange={setPrimaryHex}
          />
          <ColorField
            label={t('colors.secondaryColor')}
            value={secondaryHex}
            onChange={setSecondaryHex}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => onChange({ theme: { ...DEFAULT_THEME }, typography })}
          >
            <RotateCcw className="h-4 w-4" />
            {t('colors.resetColors')}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t('colors.fontsSection')}</h3>
          <p className="text-xs text-muted-foreground">{t('colors.fontsHint')}</p>
          {(
            [
              ['body', typography.bodyFontId, typography.bodyFontUrl],
              ['display', typography.displayFontId, typography.displayFontUrl],
            ] as const
          ).map(([role, fontId, fontUrl]) => (
            <div key={role} className="space-y-2 rounded-xl border border-border/60 p-3">
              <Label>{role === 'body' ? t('colors.bodyFont') : t('colors.displayFont')}</Label>
              <Select
                value={fontId}
                onValueChange={(value) => {
                  if (!isStorefrontFontId(value)) return;
                  if (role === 'body') {
                    setTypography({
                      bodyFontId: value,
                      bodyFontUrl: value === CUSTOM_STOREFRONT_FONT_ID ? fontUrl : null,
                    });
                  } else {
                    setTypography({
                      displayFontId: value,
                      displayFontUrl: value === CUSTOM_STOREFRONT_FONT_ID ? fontUrl : null,
                    });
                  }
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOREFRONT_FONT_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {locale === 'ar' ? preset.labelAr : preset.labelEn}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_STOREFRONT_FONT_ID}>{t('colors.customFont')}</SelectItem>
                </SelectContent>
              </Select>
              {fontId === CUSTOM_STOREFRONT_FONT_ID ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs">
                    <Upload className="h-3.5 w-3.5" />
                    {role === 'body' ? t('colors.uploadBodyFont') : t('colors.uploadDisplayFont')}
                    <input
                      type="file"
                      accept={FONT_ACCEPT}
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadFont(role, file);
                      }}
                    />
                  </label>
                  {fontUrl ? (
                    <span className="text-[11px] text-muted-foreground">
                      {t('colors.uploadedFile', { file: fontUrl.split('/').pop() ?? '' })}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() =>
              onChange({
                theme,
                typography: {
                  bodyFontId: DEFAULT_STOREFRONT_BODY_FONT,
                  displayFontId: DEFAULT_STOREFRONT_DISPLAY_FONT,
                  bodyFontUrl: null,
                  displayFontUrl: null,
                },
              })
            }
          >
            <RotateCcw className="h-4 w-4" />
            {t('colors.resetFonts')}
          </Button>
        </div>
      </div>

      <div
        className="rounded-2xl border border-border/60 p-4"
        style={{
          ['--primary' as string]: theme.primary,
          ['--secondary' as string]: theme.secondary,
          ['--accent' as string]: theme.accent,
        }}
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <ShoppingBag className="h-3.5 w-3.5" />
          {t('colors.previewLabel')}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="rounded-xl bg-primary text-primary-foreground">
            Primary
          </Button>
          <Button type="button" variant="secondary" className="rounded-xl">
            Secondary
          </Button>
        </div>
        <p className="mt-3 text-sm" style={{ fontFamily: typography.bodyFontId }}>
          Body preview — نص تجريبي للخط الأساسي
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground">{t('colors.hint')}</p>
    </section>
  );
}
