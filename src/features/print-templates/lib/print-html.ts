import type { PrintPaper } from '@/features/print-templates/domain/types';

/**
 * Prints one element through a hidden frame, so the page around it (and its
 * CSS) never reaches the printer. The element must be styled inline — see
 * PrintDocumentView.
 */
export function printElement(element: HTMLElement, paper: PrintPaper): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.right = '0';
  frame.style.bottom = '0';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }

  const pageSize = paper === 'a4' ? 'A4' : `${paper === '58mm' ? 58 : 80}mm auto`;
  doc.open();
  doc.write(
    `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title></title>` +
      `<style>@page{size:${pageSize};margin:${paper === 'a4' ? '10mm' : '0'}}` +
      `html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>` +
      `</head><body>${element.outerHTML}</body></html>`,
  );
  doc.close();

  const images = Array.from(doc.images);
  const ready = Promise.all(
    images.map((img) =>
      img.complete ? Promise.resolve() : new Promise<void>((r) => ((img.onload = () => r()), (img.onerror = () => r()))),
    ),
  );
  void ready.then(() => {
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
  });
}
