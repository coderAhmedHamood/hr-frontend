/** Soft hyphen and invisible bidi marks — strip for clean PDF/HTML output. */
const PDF_STRIP_INVISIBLE_BIDI = /[\u00AD\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Normalize user-facing strings for print (strip problematic marks + NFC). */
export function sanitizePdfText(input: string): string {
  return (input ?? '').replace(PDF_STRIP_INVISIBLE_BIDI, '').normalize('NFC');
}
