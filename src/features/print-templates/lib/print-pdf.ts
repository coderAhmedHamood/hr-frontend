import { exportDomToPdf } from '@/components/pdf/lib/exportDomToPdf';
import {
  PRINT_PAPERS,
  type PrintPaper,
  type PrintableDocument,
} from '@/features/print-templates/domain/types';

const PX_TO_MM = 25.4 / 96;

export function pdfFileName(doc: PrintableDocument): string {
  const base = [doc.title, doc.number].filter(Boolean).join(' ').trim() || 'document';
  return `${base.replace(/[\\/:*?"<>|]+/g, '-')}.pdf`;
}

/**
 * Downloads a rendered document (PrintDocumentView) as PDF. Official
 * documents are A4; a thermal roll is one page as long as the ticket.
 */
export async function downloadDocumentPdf(
  element: HTMLElement,
  doc: PrintableDocument,
  paper: PrintPaper,
): Promise<void> {
  if (paper === 'a4') {
    await exportDomToPdf(element, pdfFileName(doc));
    return;
  }
  const width = PRINT_PAPERS.find((p) => p.id === paper)?.widthMm ?? 80;
  const height = Math.ceil(element.scrollHeight * PX_TO_MM) + 8;
  await exportDomToPdf(element, pdfFileName(doc), {
    format: [width, height],
    margin: [4, 4, 4, 4],
  });
}
