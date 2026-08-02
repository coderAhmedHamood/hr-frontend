/**
 * Curated Google Fonts for the public storefront only.
 * Admin picks an id; the store shell loads CSS and sets --font-body / --font-display.
 */

export const STOREFRONT_FONT_IDS = [
  'ibm-plex-sans-arabic',
  'rubik',
  'cairo',
  'tajawal',
  'noto-sans-arabic',
  'almarai',
  'changa',
  'ibm-plex-sans',
] as const;

export type StorefrontFontId = (typeof STOREFRONT_FONT_IDS)[number];

export type StorefrontFontPreset = {
  id: StorefrontFontId;
  /** CSS font-family name (quoted as needed by Google). */
  family: string;
  /** Google Fonts CSS2 family param (spaces → +). */
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
];

export const DEFAULT_STOREFRONT_BODY_FONT: StorefrontFontId = 'ibm-plex-sans-arabic';
export const DEFAULT_STOREFRONT_DISPLAY_FONT: StorefrontFontId = 'rubik';

export type StorefrontTypography = {
  bodyFontId: StorefrontFontId;
  displayFontId: StorefrontFontId;
};

export const DEFAULT_STOREFRONT_TYPOGRAPHY: StorefrontTypography = {
  bodyFontId: DEFAULT_STOREFRONT_BODY_FONT,
  displayFontId: DEFAULT_STOREFRONT_DISPLAY_FONT,
};

const PRESET_BY_ID = new Map(STOREFRONT_FONT_PRESETS.map((preset) => [preset.id, preset]));

export function isStorefrontFontId(value: string | null | undefined): value is StorefrontFontId {
  return Boolean(value && PRESET_BY_ID.has(value as StorefrontFontId));
}

export function resolveStorefrontFontId(
  value: string | null | undefined,
  fallback: StorefrontFontId,
): StorefrontFontId {
  return isStorefrontFontId(value) ? value : fallback;
}

export function getStorefrontFontPreset(id: StorefrontFontId): StorefrontFontPreset {
  return PRESET_BY_ID.get(id) ?? PRESET_BY_ID.get(DEFAULT_STOREFRONT_BODY_FONT)!;
}

export function buildGoogleFontsStylesheetUrl(fontIds: StorefrontFontId[]): string {
  const unique = [...new Set(fontIds)];
  const families = unique.map((id) => {
    const preset = getStorefrontFontPreset(id);
    const weights = preset.weights.join(';');
    return `family=${preset.googleFamily}:wght@${weights}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

export function storefrontFontFamilyCss(id: StorefrontFontId): string {
  const family = getStorefrontFontPreset(id).family;
  return `'${family}', system-ui, sans-serif`;
}
