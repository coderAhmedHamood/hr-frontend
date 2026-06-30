import { resolveApiBaseUrl } from '@/shared/api-base-url';

const UPLOAD_PATH_PREFIX = '/uploads/';

function extractUploadPath(value: string): string | null {
  if (value.startsWith(UPLOAD_PATH_PREFIX)) {
    return value;
  }

  if (value.startsWith('uploads/')) {
    return `/${value}`;
  }

  try {
    const pathname = new URL(value).pathname;
    if (pathname.startsWith(UPLOAD_PATH_PREFIX)) {
      return pathname;
    }
  } catch {
    // not an absolute URL
  }

  const idx = value.indexOf(UPLOAD_PATH_PREFIX);
  if (idx >= 0) {
    return value.slice(idx);
  }

  return null;
}

/** Turn stored upload paths/URLs into a browser-loadable src via the API proxy. */
export function resolveUploadUrl(urlOrPath: string | null | undefined): string {
  if (!urlOrPath?.trim()) return '';

  const value = urlOrPath.trim();
  if (value.startsWith('/api-backend/')) {
    return value;
  }

  const uploadPath = extractUploadPath(value);
  if (!uploadPath) {
    return value;
  }

  const apiBase = resolveApiBaseUrl().replace(/\/$/, '');
  return `${apiBase}${uploadPath}`;
}

/** Persist a stable `/uploads/...` path instead of a host-specific absolute URL. */
export function uploadResponseToStoredPath(upload: { url: string; path: string }): string {
  const fromUrl = extractUploadPath(upload.url);
  if (fromUrl) return fromUrl;

  const normalizedPath = upload.path.replace(/\\/g, '/');
  return extractUploadPath(normalizedPath) ?? upload.url;
}
