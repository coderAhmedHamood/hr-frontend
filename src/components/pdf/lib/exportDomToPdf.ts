import { PDF_PRINT_FONT_FAMILY } from '@/components/pdf/lib/pdf-print-font';

export type ExportDomToPdfOptions = {
  orientation?: 'portrait' | 'landscape';
  /**
   * Page breaks: `avoid-all` (default) never splits any element — fine for
   * short blocks, but a long block jumps whole to the next page and leaves a
   * gap. `flow` lets blocks split and keeps whole only what is marked
   * `page-break-inside: avoid` (paragraphs, a title with its first lines) —
   * for long documents such as contracts, which must have no gaps.
   */
  pageBreaks?: 'avoid-all' | 'flow';
};

/**
 * html2pdf finds its page breaks on a copy laid out inside the live page — under
 * the app CSS (Tailwind preflight: no paragraph margins, line-height 1.5, the
 * app font at weight 400) — but html2canvas then draws a copy with every
 * stylesheet removed (browser defaults, Arial bold; see `onclone`). Any line
 * that differs between the two layouts moves the content against the breaks,
 * and rows or lines get cut across two pages. This pins, inline, the values
 * the drawn copy uses, so both layouts are the same.
 */
export function pinPdfLayoutDefaults(element: HTMLElement): HTMLElement {
  const copy = element.cloneNode(true) as HTMLElement;
  const root = copy.style;
  if (!root.fontFamily) root.fontFamily = PDF_PRINT_FONT_FAMILY;
  if (!root.fontWeight) root.fontWeight = '700';
  if (!root.lineHeight) root.lineHeight = 'normal';
  root.fontFeatureSettings = 'normal';
  root.fontVariantNumeric = 'normal';
  // The browser's paragraph margins (1em), which the app CSS sets to 0.
  copy.querySelectorAll<HTMLElement>('p').forEach((p) => {
    if (!p.style.marginTop) p.style.marginTop = '1em';
    if (!p.style.marginBottom) p.style.marginBottom = '1em';
  });
  return copy;
}

/**
 * html2canvas measures where to draw each line's baseline with a 1×1 image it
 * adds to the live page; the app CSS makes images `display: block`, which puts
 * that image under the text and shifts every drawn line down (text sits on the
 * cell borders). Keep that probe image inline while exporting.
 */
export const PDF_EXPORT_METRICS_CSS =
  'img[src^="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP"]{display:inline!important}';

/** What the html2pdf worker holds between its steps (`this` in `.then`). */
type Html2PdfWorkerProps = {
  prop: { canvas: HTMLCanvasElement; pageSize: { inner: { ratio: number } } };
};

/**
 * Drops a last page that would hold only blank space — a document's bottom
 * padding or margins running a few pixels past a page end. `pageRatio` is the
 * printable height / width, as html2pdf cuts the drawn canvas into pages.
 */
export function trimBlankLastPage(canvas: HTMLCanvasElement, pageRatio: number): HTMLCanvasElement {
  const pagePx = Math.floor(canvas.width * pageRatio);
  const kept = Math.floor(canvas.height / pagePx) * pagePx;
  if (kept === 0 || kept === canvas.height) return canvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const { data } = ctx.getImageData(0, kept, canvas.width, canvas.height - kept);
  for (let i = 0; i < data.length; i += 4) {
    // Darker than the faint logo background and light row lines: content.
    if (data[i] + data[i + 1] + data[i + 2] < 600) return canvas;
  }
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = kept;
  out.getContext('2d')?.drawImage(canvas, 0, 0);
  return out;
}

/**
 * Client-side A4 PDF from a live DOM node (html2canvas + jsPDF via html2pdf.js).
 * Call only in the browser. Tailwind/global CSS is stripped in the html2canvas clone — use inline styles on printable content.
 */
export async function exportDomToPdf(
  element: HTMLElement,
  filename: string,
  options?: ExportDomToPdfOptions,
): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');
  const orientation = options?.orientation ?? 'portrait';

  const metricsFix = document.createElement('style');
  metricsFix.textContent = PDF_EXPORT_METRICS_CSS;
  document.head.appendChild(metricsFix);
  try {
    await html2pdf()
      .set({
        margin: [8, 10, 8, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => n.remove());
            clonedDoc.documentElement.setAttribute('style', 'color-scheme: light');
            clonedDoc.documentElement.className = '';
            clonedDoc.body.className = '';
            clonedDoc.body.setAttribute(
              'style',
              `background:#fff;margin:0;padding:0;font-family:${PDF_PRINT_FONT_FAMILY};font-weight:700;color:#000`,
            );
            const reset = clonedDoc.createElement('style');
            reset.textContent =
              '*,*::before,*::after{box-sizing:border-box}' + 'img{max-width:100%;height:auto}';
            clonedDoc.head.appendChild(reset);
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation },
        pagebreak:
          options?.pageBreaks === 'flow'
            ? { mode: ['css', 'legacy'] as const }
            : { mode: ['avoid-all', 'css', 'legacy'] as const },
      })
      .from(pinPdfLayoutDefaults(element))
      .toCanvas()
      .then(function (this: Html2PdfWorkerProps) {
        this.prop.canvas = trimBlankLastPage(this.prop.canvas, this.prop.pageSize.inner.ratio);
      })
      .save();
  } finally {
    metricsFix.remove();
  }
}
