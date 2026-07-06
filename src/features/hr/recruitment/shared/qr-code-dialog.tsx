'use client';

import * as React from 'react';
import { Link, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AtsJob } from '@/features/hr/recruitment/lib/ats/types';
import { publicJobUrl, generateQRCode, copyToClipboard, downloadQR } from '@/features/hr/recruitment/lib/ats/utils';

interface QRCodeDialogProps {
  job: AtsJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeDialog({ job, open, onOpenChange }: QRCodeDialogProps) {
  const [qrUrl, setQrUrl] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !job) { setQrUrl(''); return; }
    let cancelled = false;
    setLoading(true);
    generateQRCode(publicJobUrl(job.slug)).then((url) => {
      if (!cancelled) { setQrUrl(url); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [open, job]);

  if (!job) return null;
  const url = publicJobUrl(job.slug);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-visible">
        <DialogHeader><DialogTitle>أدوات المشاركة</DialogTitle></DialogHeader>
        <div className="space-y-6 overflow-hidden">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-1">الرابط العام</p>
            <div className="flex items-center gap-2 overflow-hidden">
              <code className="flex-1 rounded bg-background px-2 py-1 text-xs text-muted-foreground break-all">{url}</code>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={() => { copyToClipboard(url); toast.success('تم النسخ'); }}>
                <Link className="h-3.5 w-3.5" /> نسخ
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            {loading && <p className="text-sm text-muted-foreground">جارٍ إنشاء رمز QR…</p>}
            {!loading && qrUrl && <img src={qrUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-border" />}
            {qrUrl && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadQR(qrUrl, `${job.slug}-qr.png`)}>
                <Download className="h-3.5 w-3.5" /> تحميل QR
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
