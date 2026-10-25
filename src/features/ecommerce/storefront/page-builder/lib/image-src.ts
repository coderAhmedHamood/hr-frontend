/**
 * A CMS image source: an absolute http(s) URL, or an uploaded file's stored
 * path (`/uploads/...`, see `uploadResponseToStoredPath`), resolved to the
 * API at render time by `resolveStorefrontImageSrc`.
 */
export function isImageSrc(value: string): boolean {
  if (value.startsWith('/')) return value.length > 1 && !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
