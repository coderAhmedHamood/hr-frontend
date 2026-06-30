/** Runtime overrides for `--primary` / `--secondary` (HSL channels, same format as globals.css). */

import { COMPANY_THEME_VARS_STORAGE_KEY } from '@/shared/constants/branding';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const PRIMARY_SCALE_VARS = [
  '--primary-50',
  '--primary-100',
  '--primary-200',
  '--primary-500',
  '--primary-700',
  '--primary-900',
] as const;

const THEME_VARS = [
  '--primary',
  '--primary-foreground',
  ...PRIMARY_SCALE_VARS,
  '--accent',
  '--accent-foreground',
  '--secondary',
  '--secondary-foreground',
  '--ring',
] as const;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value.trim());
}

export function normalizeHexColor(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !isValidHexColor(trimmed)) return null;
  return trimmed.toLowerCase();
}

/** `#RRGGBB` → `H S% L%` for `hsl(var(--primary))`. */
export function hexToHslChannels(hex: string): string | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;

  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / delta + 2) / 6;
    else h = ((r - g) / delta + 4) / 6;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Light text on dark fills; dark ink on light fills (matches globals.css tokens). */
export function foregroundHslForBackground(hslChannels: string): string {
  const lightness = Number.parseFloat(hslChannels.split(' ')[2]?.replace('%', '') ?? '50');
  return lightness < 55 ? '38 30% 97%' : '180 25% 10%';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHslChannels(channels: string): { h: number; s: number; l: number } | null {
  const match = channels.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function formatHslChannels(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`;
}

/** Tint/shade scale for `primary-*` utilities (ratios aligned with globals.css defaults). */
export function derivePrimaryScale(baseHsl: string): Record<(typeof PRIMARY_SCALE_VARS)[number], string> {
  const parsed = parseHslChannels(baseHsl);
  if (!parsed) {
    return {
      '--primary-50': baseHsl,
      '--primary-100': baseHsl,
      '--primary-200': baseHsl,
      '--primary-500': baseHsl,
      '--primary-700': baseHsl,
      '--primary-900': baseHsl,
    };
  }

  const { h, s, l } = parsed;
  return {
    '--primary-50': formatHslChannels(h, s * 0.73, 96),
    '--primary-100': formatHslChannels(h, s * 0.69, 90),
    '--primary-200': formatHslChannels(h, s * 0.64, 80),
    '--primary-500': formatHslChannels(h, s * 0.91, clamp(l + 12, 0, 100)),
    '--primary-700': formatHslChannels(h, s, clamp(l + 4, 0, 100)),
    '--primary-900': formatHslChannels(h, s * 1.09, clamp(l - 6, 8, 100)),
  };
}

function deriveAccentFromPrimary(primaryHsl: string): { accent: string; accentForeground: string } {
  const parsed = parseHslChannels(primaryHsl);
  if (!parsed) {
    return { accent: primaryHsl, accentForeground: primaryHsl };
  }

  return {
    accent: formatHslChannels(parsed.h, parsed.s * 0.55, 92),
    accentForeground: primaryHsl,
  };
}

/** Build CSS variable overrides for persistence / boot script (no DOM access). */
export function buildCompanyThemeCssVars(colors: {
  primary?: string | null;
  secondary?: string | null;
}): Record<string, string> {
  const primary = normalizeHexColor(colors.primary);
  const secondary = normalizeHexColor(colors.secondary);
  const vars: Record<string, string> = {};

  if (!primary && !secondary) {
    return vars;
  }

  if (primary) {
    const primaryHsl = hexToHslChannels(primary);
    if (primaryHsl) {
      vars['--primary'] = primaryHsl;
      vars['--primary-foreground'] = foregroundHslForBackground(primaryHsl);
      vars['--ring'] = primaryHsl;
      Object.assign(vars, derivePrimaryScale(primaryHsl));
      const accent = deriveAccentFromPrimary(primaryHsl);
      vars['--accent'] = accent.accent;
      vars['--accent-foreground'] = accent.accentForeground;
    }
  }

  if (secondary) {
    const secondaryHsl = hexToHslChannels(secondary);
    if (secondaryHsl) {
      vars['--secondary'] = secondaryHsl;
      vars['--secondary-foreground'] = foregroundHslForBackground(secondaryHsl);
    }
  }

  return vars;
}

export function applyCompanyThemeCssVars(
  vars: Record<string, string>,
  root: HTMLElement = document.documentElement,
): void {
  clearCompanyTheme(root);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

export function clearPersistedCompanyThemeCssVars(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(COMPANY_THEME_VARS_STORAGE_KEY);
  } catch {
    // ignore private mode
  }
}

export function persistCompanyThemeCssVars(colors: {
  primary?: string | null;
  secondary?: string | null;
}): void {
  if (typeof window === 'undefined') return;

  const vars = buildCompanyThemeCssVars(colors);
  try {
    if (Object.keys(vars).length === 0) {
      clearPersistedCompanyThemeCssVars();
      return;
    }
    localStorage.setItem(COMPANY_THEME_VARS_STORAGE_KEY, JSON.stringify(vars));
  } catch {
    // ignore quota / private mode
  }
}

export function readPersistedCompanyThemeCssVars(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COMPANY_THEME_VARS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

export function clearCompanyTheme(root: HTMLElement = document.documentElement): void {
  for (const name of THEME_VARS) {
    root.style.removeProperty(name);
  }
}

export function applyCompanyTheme(colors: {
  primary?: string | null;
  secondary?: string | null;
}): void {
  if (typeof document === 'undefined') return;

  const vars = buildCompanyThemeCssVars(colors);
  if (Object.keys(vars).length === 0) {
    clearCompanyTheme();
    clearPersistedCompanyThemeCssVars();
    return;
  }

  applyCompanyThemeCssVars(vars);
  persistCompanyThemeCssVars(colors);
}
