import { getPdfLogoSrc, PDF_LOGO_PUBLIC_PATH } from '@/components/pdf/lib/pdf-logo-url';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';

export type PdfCompanyLetterhead = {
  companyNameAr: string;
  companyNameEn: string;
  commercialReg: string;
  logoSrc: string | undefined;
};

export type PdfCompanySource = {
  nameAr?: string | null;
  nameEn?: string | null;
  commercialRegistrationNo?: string | null;
  logoUrl?: string | null;
};

export function isDefaultPdfLogoSrc(src?: string | null): boolean {
  if (!src?.trim()) return true;
  try {
    const path = new URL(src, 'http://local').pathname;
    return path === PDF_LOGO_PUBLIC_PATH || path.endsWith('/logo.webp');
  } catch {
    return src.includes('logo.webp');
  }
}

/** The company's own logo; none when it has not uploaded one (no fixed logo). */
export function resolvePdfLogoSrc(rawLogoUrl?: string | null): string | undefined {
  const trimmed = rawLogoUrl?.trim();
  if (trimmed) {
    const resolved = resolveUploadUrl(trimmed);
    if (typeof window === 'undefined') return resolved;
    try {
      return new URL(resolved, window.location.origin).href;
    } catch {
      return resolved;
    }
  }
  return undefined;
}

/**
 * The letterhead of the company printing the document: its own name,
 * commercial registration and logo — never another establishment's. A
 * missing field stays empty (and is not printed).
 */
export function buildPdfCompanyLetterhead(source?: PdfCompanySource | null): PdfCompanyLetterhead {
  return {
    companyNameAr: source?.nameAr?.trim() || '',
    companyNameEn: source?.nameEn?.trim() || '',
    commercialReg: source?.commercialRegistrationNo?.trim() || '',
    logoSrc: resolvePdfLogoSrc(source?.logoUrl),
  };
}
