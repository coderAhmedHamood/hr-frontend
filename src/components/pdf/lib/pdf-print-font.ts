/**
 * Single typeface for every printable HTML document and html2pdf export.
 * Matches employment-contract print (Arial) so preview and PDF stay identical.
 */
export const PDF_PRINT_FONT_FAMILY = 'Arial, Helvetica, sans-serif';

export const PDF_PRINT_FONT_STYLE = {
  fontFamily: PDF_PRINT_FONT_FAMILY,
} as const;
