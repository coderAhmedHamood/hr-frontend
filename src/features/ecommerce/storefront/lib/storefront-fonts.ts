/**
 * Curated Google Fonts + custom upload for the public storefront only.
 * Admin picks an id (or uploads a file); the store loads only the selected fonts.
 */

export const CUSTOM_STOREFRONT_FONT_ID = 'custom' as const;

export const STOREFRONT_GOOGLE_FONT_IDS = [
  'ibm-plex-sans-arabic',
  'rubik',
  'cairo',
  'tajawal',
  'noto-sans-arabic',
  'almarai',
  'changa',
  'ibm-plex-sans',
  'amiri',
  'readex-pro',
] as const;

export const STOREFRONT_FONT_IDS = [
  ...STOREFRONT_GOOGLE_FONT_IDS,
  CUSTOM_STOREFRONT_FONT_ID,
] as const;

export type StorefrontFontId = (typeof STOREFRONT_FONT_IDS)[number];

export type StorefrontFontPreset = {
  id: Exclude<StorefrontFontId, 'custom'>;
  family: string;
  googleFamily: string;
  labelAr: string;
  labelEn: string;
  weights: number[];
};

export const STOREFRONT_FONT_PRESETS: StorefrontFontPreset[] = [
  {
    id: 'ibm-plex-sans-arabic',
    family: 'IBM Plex Sans Arabic',
    googleFamily: 'IBM+Plex+Sans+Arabic',
    labelAr: 'IBM Plex Sans Arabic',
    labelEn: 'IBM Plex Sans Arabic',
    weights: [300, 400, 500, 600, 700],
  },
  {
    id: 'rubik',
    family: 'Rubik',
    googleFamily: 'Rubik',
    labelAr: 'Rubik',
    labelEn: 'Rubik',
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    id: 'cairo',
    family: 'Cairo',
    googleFamily: 'Cairo',
    labelAr: 'Cairo',
    labelEn: 'Cairo',
    weights: [300, 400, 500, 600, 700],
  },
  {
    id: 'tajawal',
    family: 'Tajawal',
    googleFamily: 'Tajawal',
    labelAr: 'Tajawal',
    labelEn: 'Tajawal',
    weights: [300, 400, 500, 700],
  },
  {
    id: 'noto-sans-arabic',
    family: 'Noto Sans Arabic',
    googleFamily: 'Noto+Sans+Arabic',
    labelAr: 'Noto Sans Arabic',
    labelEn: 'Noto Sans Arabic',
    weights: [300, 400, 500, 600, 700],
  },
  {
    id: 'almarai',
    family: 'Almarai',
    googleFamily: 'Almarai',
    labelAr: 'Almarai',
    labelEn: 'Almarai',
    weights: [300, 400, 700, 800],
  },
  {
    id: 'changa',
    family: 'Changa',
    googleFamily: 'Changa',
    labelAr: 'Changa',
    labelEn: 'Changa',
    weights: [300, 400, 500, 600, 700],
  },
  {
    id: 'ibm-plex-sans',
    family: 'IBM Plex Sans',
    googleFamily: 'IBM+Plex+Sans',
    labelAr: 'IBM Plex Sans',
    labelEn: 'IBM Plex Sans',
    weights: [300, 400, 500, 600, 700],
  },
  {
    id: 'amiri',
    family: 'Amiri',
    googleFamily: 'Amiri',
    labelAr: 'Amiri',
    labelEn: 'Amiri',
    weights: [400, 700],
  },
  {
    id: 'readex-pro',
    family: 'Readex Pro',
    googleFamily: 'Readex+Pro',
    labelAr: 'Readex Pro',
    labelEn: 'Readex Pro',
    weights: [300, 400, 500, 600, 700],
  },
];

export const DEFAULT_STOREFRONT_BODY_FONT = 'ibm-plex-sans-arabic' as const satisfies Exclude<
  StorefrontFontId,
  'custom'
>;
export const DEFAULT_STOREFRONT_DISPLAY_FONT = 'rubik' as const satisfies Exclude<
  StorefrontFontId,
  'custom'
>;

export const CUSTOM_BODY_FONT_FAMILY = 'StorefrontCustomBody';
export const CUSTOM_DISPLAY_FONT_FAMILY = 'StorefrontCustomDisplay';

export type StorefrontTypography = {
  bodyFontId: StorefrontFontId;
  displayFontId: StorefrontFontId;
  bodyFontUrl: string | null;
  displayFontUrl: string | null;
};

export const DEFAULT_STOREFRONT_TYPOGRAPHY: StorefrontTypography = {
  bodyFontId: DEFAULT_STOREFRONT_BODY_FONT,
  displayFontId: DEFAULT_STOREFRONT_DISPLAY_FONT,
  bodyFontUrl: null,
  displayFontUrl: null,
};

const PRESET_BY_ID = new Map(STOREFRONT_FONT_PRESETS.map((preset) => [preset.id, preset]));

export function isStorefrontFontId(value: string | null | undefined): value is StorefrontFontId {
  return Boolean(value && (PRESET_BY_ID.has(value as never) || value === CUSTOM_STOREFRONT_FONT_ID));
}

export function resolveStorefrontFontId(
  value: string | null | undefined,
  fallback: StorefrontFontId,
): StorefrontFontId {
  return isStorefrontFontId(value) ? value : fallback;
}

export function getStorefrontFontPreset(id: Exclude<StorefrontFontId, 'custom'>): StorefrontFontPreset {
  return PRESET_BY_ID.get(id) ?? PRESET_BY_ID.get(DEFAULT_STOREFRONT_BODY_FONT)!;
}

export function buildGoogleFontsStylesheetUrl(fontIds: StorefrontFontId[]): string | null {
  const googleIds = [...new Set(fontIds)].filter(
    (id): id is Exclude<StorefrontFontId, 'custom'> => id !== CUSTOM_STOREFRONT_FONT_ID,
  );
  if (googleIds.length === 0) return null;
  const families = googleIds.map((id) => {
    const preset = getStorefrontFontPreset(id);
    return `family=${preset.googleFamily}:wght@${preset.weights.join(';')}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

function fontFormatFromUrl(url: string): string {
  const lower = url.toLowerCase().split('?')[0] ?? '';
  if (lower.endsWith('.woff2')) return 'woff2';
  if (lower.endsWith('.woff')) return 'woff';
  if (lower.endsWith('.otf')) return 'opentype';
  if (lower.endsWith('.ttf')) return 'truetype';
  return 'woff2';
}

export function buildCustomFontFaceCss(family: string, url: string): string {
  const format = fontFormatFromUrl(url);
  return `@font-face{font-family:'${family}';src:url('${url}') format('${format}');font-display:swap;font-style:normal;font-weight:100 900;}`;
}

export function storefrontFontFamilyCss(
  id: StorefrontFontId,
  role: 'body' | 'display',
): string {
  if (id === CUSTOM_STOREFRONT_FONT_ID) {
    const family = role === 'body' ? CUSTOM_BODY_FONT_FAMILY : CUSTOM_DISPLAY_FONT_FAMILY;
    return `'${family}', system-ui, sans-serif`;
  }
  return `'${getStorefrontFontPreset(id).family}', system-ui, sans-serif`;
}
