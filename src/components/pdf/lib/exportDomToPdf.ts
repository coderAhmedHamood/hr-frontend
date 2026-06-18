export type ExportDomToPdfOptions = {
  orientation?: 'portrait' | 'landscape';
};

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
            'background:#fff;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111',
          );
          const reset = clonedDoc.createElement('style');
          reset.textContent =
            '*,*::before,*::after{box-sizing:border-box}' + 'img{max-width:100%;height:auto}';
          clonedDoc.head.appendChild(reset);
        },
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const },
    })
    .from(element)
    .save();
}
