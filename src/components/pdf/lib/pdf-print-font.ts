/**
 * Single typeface for every printable HTML document and html2pdf export.
 * Weight matches backend official PDFs (Tajawal bold via Playwright).
 */
export const PDF_PRINT_FONT_FAMILY = 'Arial, Helvetica, sans-serif';

export const PDF_PRINT_FONT_STYLE = {
  fontFamily: PDF_PRINT_FONT_FAMILY,
  fontWeight: 700,
} as const;
