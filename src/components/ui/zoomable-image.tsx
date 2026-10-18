'use client';

import * as React from 'react';
import { Download, Loader2, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerBrowserDownload } from '@/shared/export/download-blob';
import { cn } from '@/shared/utils';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const WHEEL_ZOOM_STEP = 0.0015;
const BUTTON_ZOOM_STEP = 0.6;

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** Distance between two touch points (for pinch-to-zoom). */
function touchDistance(a: React.Touch | Touch, b: React.Touch | Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

type Props = {
  src: string;
  alt?: string;
  /** File name used when the user downloads the image. */
  downloadFileName?: string;
  className?: string;
  imgClassName?: string;
};

/**
 * An image preview that can be zoomed (wheel, pinch, or +/- buttons), panned
 * by dragging once zoomed, reset, and downloaded — for use inside preview
 * dialogs (receipts, attachments, …).
 */
export function ZoomableImage({ src, alt = '', downloadFileName, className, imgClassName }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = React.useState(false);
  const dragState = React.useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pinchState = React.useRef<{ distance: number; scale: number } | null>(null);

  // Reset pan/zoom whenever the image itself changes (e.g. switching thumbnails).
  React.useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  const clampOffset = React.useCallback((next: { x: number; y: number }, nextScale: number) => {
    const el = containerRef.current;
    if (!el || nextScale <= 1) return { x: 0, y: 0 };
    // Allows panning roughly across the overflow created by the current zoom level.
    const maxX = (el.clientWidth * (nextScale - 1)) / 2;
    const maxY = (el.clientHeight * (nextScale - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }, []);

  const zoomTo = React.useCallback(
    (nextScale: number) => {
      const clamped = clampScale(nextScale);
      setScale(clamped);
      setOffset((prev) => (clamped <= 1 ? { x: 0, y: 0 } : clampOffset(prev, clamped)));
    },
    [clampOffset],
  );

  const zoomIn = React.useCallback(() => zoomTo(scale + BUTTON_ZOOM_STEP), [scale, zoomTo]);
  const zoomOut = React.useCallback(() => zoomTo(scale - BUTTON_ZOOM_STEP), [scale, zoomTo]);
  const reset = React.useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      zoomTo(scale - e.deltaY * WHEEL_ZOOM_STEP * scale);
    },
    [scale, zoomTo],
  );

  const handleDoubleClick = React.useCallback(() => {
    zoomTo(scale > 1 ? 1 : 2.5);
  }, [scale, zoomTo]);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scale <= 1) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragState.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
    },
    [scale, offset],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.x;
      const dy = e.clientY - dragState.current.y;
      setOffset(
        clampOffset(
          { x: dragState.current.offsetX + dx, y: dragState.current.offsetY + dy },
          scale,
        ),
      );
    },
    [scale, clampOffset],
  );

  const endDrag = React.useCallback(() => {
    dragState.current = null;
  }, []);

  const handleTouchStart = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      pinchState.current = { distance: touchDistance(e.touches[0]!, e.touches[1]!), scale };
    }
  }, [scale]);

  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && pinchState.current) {
        e.preventDefault();
        const distance = touchDistance(e.touches[0]!, e.touches[1]!);
        const ratio = distance / pinchState.current.distance;
        zoomTo(pinchState.current.scale * ratio);
      }
    },
    [zoomTo],
  );

  const handleTouchEnd = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) pinchState.current = null;
  }, []);

  const handleDownload = React.useCallback(async () => {
    setDownloading(true);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const extension = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
      const fileName = downloadFileName || `receipt-${Date.now()}.${extension}`;
      triggerBrowserDownload(blob, fileName);
    } catch {
      // Falls back to opening the image directly so the user can still save it manually.
      window.open(src, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }, [src, downloadFileName]);

  const isZoomed = scale > 1;

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border bg-muted/30', className)}>
      <div
        ref={containerRef}
        className={cn(
          'flex max-h-[70vh] min-h-[220px] items-center justify-center overflow-hidden touch-none select-none',
          isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
        )}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary upload/proof hosts */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={cn('max-h-[70vh] w-full object-contain transition-transform', imgClassName)}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transitionProperty: dragState.current || pinchState.current ? 'none' : undefined,
          }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1 px-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-card/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            title="تصغير"
            aria-label="تصغير"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-10 text-center text-[11px] font-medium tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            title="تكبير"
            aria-label="تكبير"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-0.5 h-5 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={reset}
            disabled={scale === 1 && offset.x === 0 && offset.y === 0}
            title="إعادة الضبط"
            aria-label="إعادة الضبط"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => void handleDownload()}
            disabled={downloading}
            title="تنزيل الصورة"
            aria-label="تنزيل الصورة"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
