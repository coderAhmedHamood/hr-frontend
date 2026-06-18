/** Default logo under `public/` (DOM / html2pdf templates). */
export const PDF_LOGO_PUBLIC_PATH = '/logo.webp';

/**
 * Absolute URL for `<img src={…}>` in DOM-based PDF / print previews.
 * Returns `undefined` during SSR or if `URL` fails.
 */
export function getPdfLogoSrc(path: string = PDF_LOGO_PUBLIC_PATH): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return undefined;
  }
}
