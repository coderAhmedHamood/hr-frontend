'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storefrontPublicLinksHref } from '@/features/ecommerce/storefront/lib/store-paths';
import { publicConfig } from '@/shared/config';

const PUBLIC_URL_STORAGE_KEY = 'erp.storeLinksPublicUrl';

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

/** A hosting address already configured for the site, never the local machine. */
function hostedLinksUrl(path: string): string {
  const site = publicConfig.siteUrl.replace(/\/$/, '');
  if (!site) return '';
  try {
    const parsed = new URL(site);
    if (isLocalHost(parsed.hostname)) return '';
    return `${parsed.origin}${path}`;
  } catch {
    return '';
  }
}

/** Origin plus the links path, or the full links URL if that is what was typed. */
function resolvePublicLinksUrl(raw: string, path: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (isLocalHost(parsed.hostname)) return null;
  const pathname = parsed.pathname.replace(/\/$/, '');
  if (pathname.endsWith('/store/links')) return `${parsed.origin}${pathname}`;
  return `${parsed.origin}${path}`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('qr image failed'));
    image.src = src;
  });
}

/** PNG of the barcode with the public URL written under it, ready to send. */
async function buildShareImage(qrSrc: string, url: string, caption: string): Promise<string> {
  const qr = await loadImage(qrSrc);
  const width = 800;
  const pad = 48;
  const qrSize = 520;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.font = '24px Segoe UI, Tahoma, sans-serif';
  const urlLines = wrapText(ctx, url, width - pad * 2);
  const height = pad + 56 + 28 + qrSize + 36 + urlLines.length * 34 + 28 + pad;
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.font = '700 34px Segoe UI, Tahoma, sans-serif';
  ctx.fillText(caption, width / 2, pad + 34);
  ctx.drawImage(qr, (width - qrSize) / 2, pad + 64, qrSize, qrSize);
  ctx.direction = 'ltr';
  ctx.font = '22px Segoe UI, Tahoma, sans-serif';
  ctx.fillStyle = '#333333';
  let y = pad + 64 + qrSize + 40;
  for (const line of urlLines) {
    ctx.fillText(line, width / 2, y);
    y += 34;
  }
  return canvas.toDataURL('image/png');
}

/** Printable barcode for the public contact-links page. */
export function FieldLinksQrCard() {
  const t = useTranslations('ecommerceAdmin.settings');
  const caption = t('fieldQrImageCaption');
  const path = storefrontPublicLinksHref();
  const [draftUrl, setDraftUrl] = React.useState('');
  const [cardUrl, setCardUrl] = React.useState<string | null>(null);
  const targetUrl = resolvePublicLinksUrl(draftUrl, path);
  const localhostRejected = draftUrl.trim().length > 0 && !targetUrl && /localhost|127\.0\.0\.1/i.test(draftUrl);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(PUBLIC_URL_STORAGE_KEY)?.trim() ?? '';
    setDraftUrl(resolvePublicLinksUrl(stored, path) ? stored : hostedLinksUrl(path));
  }, [path]);

  React.useEffect(() => {
    if (!targetUrl) {
      setCardUrl(null);
      if (!draftUrl.trim()) window.localStorage.removeItem(PUBLIC_URL_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(PUBLIC_URL_STORAGE_KEY, targetUrl);
    let cancelled = false;
    void (async () => {
      const qr = await QRCode.toDataURL(targetUrl, { width: 640, margin: 1, errorCorrectionLevel: 'M' });
      const card = await buildShareImage(qr, targetUrl, caption);
      if (!cancelled) setCardUrl(card);
    })();
    return () => {
      cancelled = true;
    };
  }, [targetUrl, caption, draftUrl]);

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm font-medium text-foreground">{t('fieldQrTitle')}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{t('fieldQrHint')}</p>
        <label className="mt-2 block space-y-1.5">
          <span className="text-xs font-medium text-foreground">{t('fieldQrUrlLabel')}</span>
          <Input
            dir="ltr"
            inputMode="url"
            className="font-mono text-sm"
            placeholder={t('fieldQrUrlPlaceholder')}
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
          />
        </label>
        {localhostRejected ? (
          <p role="alert" className="text-xs text-destructive">{t('fieldQrLocalhost')}</p>
        ) : draftUrl.trim() && !targetUrl ? (
          <p role="alert" className="text-xs text-destructive">{t('fieldQrUrlInvalid')}</p>
        ) : targetUrl ? (
          <p className="break-all text-xs text-muted-foreground" dir="ltr">{targetUrl}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 gap-1.5"
          disabled={!cardUrl}
          onClick={() => {
            if (!cardUrl) return;
            const anchor = document.createElement('a');
            anchor.href = cardUrl;
            anchor.download = 'store-links.png';
            anchor.click();
          }}
        >
          <Download className="h-3.5 w-3.5" />
          {t('fieldQrDownload')}
        </Button>
      </div>
      {cardUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cardUrl} alt="" className="h-44 w-36 shrink-0 rounded-xl border border-border bg-white object-contain" />
      ) : (
        <div className="h-44 w-36 shrink-0 animate-pulse rounded-xl bg-muted" />
      )}
    </div>
  );
}
