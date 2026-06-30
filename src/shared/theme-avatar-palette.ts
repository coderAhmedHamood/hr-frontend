/** Deterministic avatar surfaces from globals.css tokens (no inline HSL/hex). */

export const THEME_AVATAR_PALETTE = [
  'bg-primary text-primary-foreground',
  'bg-primary-700 text-primary-foreground',
  'bg-primary-500 text-primary-foreground',
  'bg-success text-success-foreground',
  'bg-warning text-warning-foreground',
  'bg-gold text-gold-foreground',
  'bg-destructive text-destructive-foreground',
  'bg-secondary text-secondary-foreground',
] as const;

export function themeAvatarClassFromKey(key: string): string {
  let index = 0;
  for (let i = 0; i < key.length; i++) {
    index = (index + key.charCodeAt(i) * (i + 1)) % THEME_AVATAR_PALETTE.length;
  }
  return THEME_AVATAR_PALETTE[index] ?? THEME_AVATAR_PALETTE[0];
}
