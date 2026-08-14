/** Ignore blank CMS values — Next `<Image>` rejects `src=""`. */
export function resolveStorefrontImageSrc(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
}

export function hasStorefrontImageSrc(url: string | null | undefined): boolean {
  return resolveStorefrontImageSrc(url) != null;
}
