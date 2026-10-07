'use client';

import * as React from 'react';
import { Camera, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  dialogMobileFullScreenClass,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A code read by the camera or typed (a handheld scanner types + Enter). */
  onCode: (code: string) => void;
  title?: string;
  /** Keep the camera on after a read (several items in a row). */
  continuous?: boolean;
  /** Shown under the camera, e.g. the last item added. */
  status?: React.ReactNode;
};

type Controls = { stop: () => void };

/**
 * Barcode / QR scanning with the phone camera (approved 2026-10-07). The
 * reader (@zxing/browser) is loaded only when the dialog opens. A code read
 * twice within 1.5 s counts once. Typing a code works too: for a handheld
 * scanner, or when the camera is not allowed (it needs HTTPS and permission).
 */
export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onCode,
  title = 'مسح الباركود',
  continuous = false,
  status,
}: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsRef = React.useRef<Controls | null>(null);
  const lastRef = React.useRef<{ code: string; at: number } | null>(null);
  const onCodeRef = React.useRef(onCode);
  onCodeRef.current = onCode;
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [typed, setTyped] = React.useState('');

  const emit = React.useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const now = Date.now();
      if (lastRef.current && lastRef.current.code === code && now - lastRef.current.at < 1500) return;
      lastRef.current = { code, at: now };
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(60);
      onCodeRef.current(code);
      if (!continuous) onOpenChange(false);
    },
    [continuous, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCameraError(null);
    setTyped('');
    lastRef.current = null;

    void (async () => {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setCameraError('الكاميرا تحتاج اتصالاً آمناً (HTTPS). اكتب الرمز يدوياً.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('هذا المتصفح لا يدعم الكاميرا. اكتب الرمز يدوياً.');
        return;
      }
      setStarting(true);
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        // The dialog's video mounts after the portal opens.
        for (let i = 0; i < 20 && !videoRef.current && !cancelled; i += 1) {
          await new Promise((r) => setTimeout(r, 50));
        }
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          videoRef.current,
          (result) => {
            if (result) emit(result.getText());
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (error) {
        const name = error instanceof Error ? error.name : '';
        setCameraError(
          name === 'NotAllowedError'
            ? 'لم يُسمح باستخدام الكاميرا. اسمح بها من إعدادات المتصفح، أو اكتب الرمز يدوياً.'
            : name === 'NotFoundError'
              ? 'لا توجد كاميرا في هذا الجهاز. اكتب الرمز يدوياً.'
              : 'تعذّر تشغيل الكاميرا. اكتب الرمز يدوياً.',
        );
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setStarting(false);
    };
  }, [open, emit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-md gap-3', dialogMobileFullScreenClass, 'max-sm:p-4')}>
        <DialogHeader className="max-sm:text-right">
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>وجّه الكاميرا إلى الباركود، أو اكتبه أو امسحه بقارئ يدوي.</DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-xl bg-black max-sm:flex-1">
          {cameraError ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white/90">
              <Camera className="h-8 w-8 opacity-70" />
              {cameraError}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="aspect-[3/4] w-full object-cover max-sm:h-full max-sm:aspect-auto"
                muted
                playsInline
              />
              {/* Aim box */}
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-28 -translate-y-1/2 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              {starting ? (
                <p className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">جارٍ تشغيل الكاميرا…</p>
              ) : null}
            </>
          )}
        </div>

        {status ? <div className="text-sm">{status}</div> : null}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            // React bubbles submit through portals: without this, Enter here
            // would also submit a form the dialog opened from (e.g. create draft).
            e.stopPropagation();
            emit(typed);
            setTyped('');
          }}
        >
          <Input
            dir="ltr"
            inputMode="text"
            autoComplete="off"
            placeholder="الباركود أو SKU"
            aria-label="الباركود أو SKU"
            className="h-11 flex-1"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <Button type="submit" className="h-11" disabled={!typed.trim()}>
            إضافة
          </Button>
        </form>
        {continuous ? (
          <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            تم
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
