import type { CSSProperties } from 'react';

/** User-defined shift template hex — exposed only as `--shift-color` for `.bg-shift-color`. */
export function shiftColorStyle(colorHex?: string | null): CSSProperties | undefined {
  const trimmed = colorHex?.trim();
  if (!trimmed) return undefined;
  const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return { '--shift-color': hex } as CSSProperties;
}
