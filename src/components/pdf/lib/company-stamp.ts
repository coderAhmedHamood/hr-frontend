/** Default establishment stamp under `public/` — mirrors the backend documents asset. */
export const COMPANY_STAMP_PUBLIC_PATH = '/company-stamp.png';

/** Arabic caption printed under the stamp slot — mirrors `COMPANY_STAMP_LABEL_AR`. */
export const COMPANY_STAMP_LABEL_AR = 'ختم المنشأة';

/**
 * Absolute URL for `<img src={…}>` in DOM-based PDF / print previews.
 * Returns `undefined` during SSR or if `URL` fails.
 */
export function getCompanyStampSrc(
  path: string = COMPANY_STAMP_PUBLIC_PATH,
): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return undefined;
  }
}
