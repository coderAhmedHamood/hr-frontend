import { resolveUploadUrl } from '@/shared/resolve-upload-url';

/** Ignore blank CMS values — Next `<Image>` rejects `src=""`. */
export function resolveStorefrontImageSrc(url: string | null | undefined): string | null {
  const resolved = resolveUploadUrl(url);
  return resolved || null;
}

export function hasStorefrontImageSrc(url: string | null | undefined): boolean {
  return resolveStorefrontImageSrc(url) != null;
}
