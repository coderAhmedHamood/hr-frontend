'use client';

import * as React from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PrintDocumentView } from '@/features/print-templates/components/print-document-view';
import type {
  PrintCompany,
  PrintDocumentType,
  PrintableDocument,
} from '@/features/print-templates/domain/types';
import { printElement } from '@/features/print-templates/lib/print-html';
import { downloadDocumentPdf } from '@/features/print-templates/lib/print-pdf';
import { useDocumentPrintSettings } from '@/features/print-templates/lib/print-template-store';
import { cn } from '@/shared/utils';

/**
 * Preview, print and download as PDF a document with the company's template
 * for its type (its own template, or the unified one). Any app can use it.
 */
export function PrintDocumentDialog({
  open,
  onOpenChange,
  document,
  documentType,
  companyId,
  company,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PrintableDocument | null;
  documentType: PrintDocumentType;
  companyId: string | null | undefined;
  company: PrintCompany;
  title?: string;
}) {
  const settings = useDocumentPrintSettings(companyId, documentType);
  const ref = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = React.useState(false);

  const target = () => ref.current?.firstElementChild as HTMLElement | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(settings.paper === 'a4' ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle>{title ?? document?.title ?? 'طباعة'}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[65vh] justify-center overflow-auto rounded-md border border-border bg-muted/40 p-3">
          <div ref={ref} className={settings.paper === 'a4' ? 'origin-top scale-[0.6]' : undefined}>
            {document ? (
              <PrintDocumentView document={document} company={company} settings={settings} />
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!document || exporting}
            onClick={async () => {
              const el = target();
              if (!el || !document) return;
              setExporting(true);
              try {
                await downloadDocumentPdf(el, document, settings.paper);
                toast.success('تم تنزيل الملف');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'تعذّر تنزيل PDF');
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'جارٍ التنزيل…' : 'تنزيل PDF'}
          </Button>
          <Button
            type="button"
            disabled={!document}
            onClick={() => {
              const el = target();
              if (el) printElement(el, settings.paper);
            }}
          >
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
