'use client';

import * as React from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type OfficialPdfPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  previewUrl: string | null;
  loading?: boolean;
  downloading?: boolean;
  onDownload?: () => void;
  downloadLabel?: string;
};

/** Preview official PDFs returned by backend `GET …/:id/pdf` endpoints. */
export function OfficialPdfPreviewDialog({
  open,
  onOpenChange,
  title,
  previewUrl,
  loading = false,
  downloading = false,
  onDownload,
  downloadLabel = 'تحميل PDF',
}: OfficialPdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-3 sm:max-w-5xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحضير الملف…
          </div>
        ) : previewUrl ? (
          <object
            title={title}
            data={previewUrl}
            type="application/pdf"
            className="h-[70vh] min-h-[420px] w-full rounded-lg border border-border bg-white"
          >
            <iframe title={title} src={previewUrl} className="h-full min-h-[420px] w-full border-0" />
          </object>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">تعذر تحميل المعاينة</p>
        )}
        {onDownload ? (
          <DialogFooter className={dialogFormFooterClass}>
            <Button
              type="button"
              variant="luxe"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              disabled={!previewUrl || downloading}
              onClick={onDownload}
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 shrink-0" />
              )}
              {downloading ? 'جاري التحميل…' : downloadLabel}
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type OpenOfficialPdfPreviewArgs = {
  title: string;
  fileName: string;
  loadBlob: () => Promise<{ blob: Blob }>;
  onDownload?: () => Promise<void>;
};

/** Shared loader for detail-dialog «معاينة / تنزيل PDF» backed by Nest PDF endpoints. */
export function useOfficialPdfPreview() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const downloadRef = React.useRef<(() => Promise<void>) | null>(null);
  const previewUrlRef = React.useRef<string | null>(null);

  const revokePreviewUrl = React.useCallback(() => {
    const current = previewUrlRef.current;
    if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    revokePreviewUrl();
    downloadRef.current = null;
  }, [revokePreviewUrl]);

  const openPreview = React.useCallback(async (args: OpenOfficialPdfPreviewArgs) => {
    setOpen(true);
    setTitle(args.title);
    setLoading(true);
    revokePreviewUrl();
    downloadRef.current = args.onDownload ?? null;
    try {
      const { blob } = await args.loadBlob();
      const pdfBlob =
        blob.type === 'application/pdf'
          ? blob
          : new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      previewUrlRef.current = null;
      setPreviewUrl(null);
      setOpen(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [revokePreviewUrl]);

  const download = React.useCallback(async () => {
    if (!downloadRef.current) return;
    setDownloading(true);
    try {
      await downloadRef.current();
    } finally {
      setDownloading(false);
    }
  }, []);

  return {
    open,
    setOpen: (next: boolean) => {
      if (!next) close();
      else setOpen(true);
    },
    title,
    previewUrl,
    loading,
    downloading,
    openPreview,
    download,
    close,
  };
}
