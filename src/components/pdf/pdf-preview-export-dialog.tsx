'use client';

import * as React from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { exportDomToPdf } from '@/components/pdf/lib/exportDomToPdf';

type PdfPreviewExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileName: string;
  /** Printable HTML subtree; must be a forwardRef root (ref is attached for html2pdf export). */
  printable: React.ReactElement | null;
  emptyMessage?: string;
};

export function PdfPreviewExportDialog({
  open,
  onOpenChange,
  title,
  fileName,
  printable,
  emptyMessage = 'لا توجد بيانات للتصدير ضمن الفلاتر الحالية.',
}: PdfPreviewExportDialogProps) {
  const printableRef = React.useRef<HTMLDivElement>(null);
  const [domExporting, setDomExporting] = React.useState(false);

  const printableNode = React.useMemo(() => {
    if (!printable || !React.isValidElement(printable)) return null;
    return React.cloneElement(printable as React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }>, {
      ref: printableRef,
    });
  }, [printable]);

  const handleDomDownload = React.useCallback(async () => {
    const el = printableRef.current;
    if (!el) {
      toast.error('تعذر العثور على منطقة الطباعة');
      return;
    }
    setDomExporting(true);
    try {
      await exportDomToPdf(el, fileName);
      toast.success('تم تنزيل الملف');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تصدير PDF');
    } finally {
      setDomExporting(false);
    }
  }, [fileName]);

  const showPrintable = Boolean(open && printable && printableNode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-visible border-border p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4 text-right">
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            معاينة المستند ثم التحميل بصيغة PDF من المتصفح.
          </DialogDescription>
          <p className="text-xs text-muted-foreground" aria-hidden>
            معاينة المستند ثم التحميل بصيغة PDF
          </p>
        </DialogHeader>

        <div className="min-h-[420px] flex-1 overflow-hidden bg-muted/20">
          {showPrintable ? (
            <div className="h-full max-h-[min(75vh,820px)] overflow-auto p-4" dir="rtl">
              {printableNode}
            </div>
          ) : open ? (
            <div className="flex h-[480px] flex-col items-center justify-center gap-3 px-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          {showPrintable ? (
            <Button
              type="button"
              variant="luxe"
              size="sm"
              className="gap-2"
              disabled={domExporting}
              onClick={handleDomDownload}
            >
              {domExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {domExporting ? 'جارٍ التصدير…' : 'تحميل PDF'}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
