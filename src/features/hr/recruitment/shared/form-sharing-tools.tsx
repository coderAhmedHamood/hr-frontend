'use client';

import * as React from 'react';
import { Link, ExternalLink, Download, Share2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RecruitmentForm } from '@/features/hr/recruitment/lib/types';
import { generateQrDataUrl, downloadQrCode, copyToClipboard, getPublicFormUrl } from '@/features/hr/recruitment/lib/utils';

interface FormSharingToolsProps {
  form: RecruitmentForm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormSharingTools({ form, open, onOpenChange }: FormSharingToolsProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);

  const publicUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    return getPublicFormUrl(form.id);
  }, [form.id]);

  React.useEffect(() => {
    if (!open) { setQrDataUrl(null); return; }
    if (!publicUrl) return;
    setGenerating(true);
    generateQrDataUrl(publicUrl)
      .then((url) => setQrDataUrl(url))
      .catch(() => toast.error('فشل إنشاء رمز QR'))
      .finally(() => setGenerating(false));
  }, [open, publicUrl]);

  const handleCopy = async () => {
    if (!publicUrl) return;
    try { await copyToClipboard(publicUrl); toast.success('تم نسخ الرابط'); } catch { toast.error('فشل النسخ'); }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    downloadQrCode(qrDataUrl, `qr-${form.id}.png`);
    toast.success('تم تنزيل رمز QR');
  };

  const handleOpen = () => {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank');
  };

  const handleShare = async () => {
    if (!publicUrl) return;
    if (navigator.share) {
      try { await navigator.share({ title: form.title, text: form.description, url: publicUrl }); } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>أدوات المشاركة</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 overflow-hidden">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-1">الرابط العام</p>
            <div className="flex items-center gap-2 overflow-hidden">
              <code className="flex-1 rounded bg-background px-2 py-1 text-xs text-muted-foreground break-all">{publicUrl}</code>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={handleCopy}>
                <Link className="h-3.5 w-3.5" /> نسخ
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {generating && <p className="text-sm text-muted-foreground">جارٍ إنشاء رمز QR…</p>}
            {!generating && qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 rounded-lg border border-border" />
            )}
            {!generating && !qrDataUrl && (
              <div className="h-48 w-48 rounded-lg border border-dashed border-border flex items-center justify-center">
                <QrCode className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpen}>
              <ExternalLink className="h-3.5 w-3.5" /> فتح الصفحة
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload} disabled={!qrDataUrl}>
              <Download className="h-3.5 w-3.5" /> تنزيل QR
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 col-span-2" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" /> مشاركة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
