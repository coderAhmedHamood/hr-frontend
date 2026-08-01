'use client';

import * as React from 'react';
import { ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import { resolvePaymentProofUrls } from '@/features/ecommerce/domain/lib/payment-proofs';

type Props = {
  /** One or more receipt image URLs. */
  urls?: string[] | null;
  /** @deprecated Prefer `urls`. */
  url?: string | null;
  orderNumber?: string;
  /** Compact icon button (Kanban) vs larger preview (detail). */
  size?: 'sm' | 'md';
  className?: string;
};

export function OrderPaymentProofThumb({
  urls,
  url,
  orderNumber,
  size = 'sm',
  className,
}: Props) {
  const proofUrls = resolvePaymentProofUrls({ paymentProofUrls: urls ?? undefined, paymentProofUrl: url });
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isSm = size === 'sm';

  if (proofUrls.length === 0) return null;

  const primary = proofUrls[Math.min(activeIndex, proofUrls.length - 1)]!;
  const count = proofUrls.length;

  return (
    <>
      <button
        type="button"
        className={cn(
          'group relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 text-start transition-colors hover:border-primary/50',
          isSm ? 'h-9 w-9' : 'h-20 w-20',
          className,
        )}
        title={count > 1 ? `معاينة إيصالات الدفع (${count})` : 'معاينة إيصال الدفع'}
        aria-label={count > 1 ? `معاينة إيصالات الدفع (${count})` : 'معاينة إيصال الدفع'}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setActiveIndex(0);
          setOpen(true);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- data URLs + arbitrary proof hosts */}
        <img src={primary} alt="" className="h-full w-full object-cover" />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-foreground/35 opacity-0 transition-opacity group-hover:opacity-100',
            isSm && 'opacity-100 bg-foreground/25',
          )}
        >
          <ImageIcon className={cn('text-background', isSm ? 'h-3.5 w-3.5' : 'h-5 w-5')} />
        </span>
        {count > 1 ? (
          <span className="absolute end-0.5 top-0.5 rounded bg-foreground/80 px-1 text-[9px] font-bold leading-4 text-background">
            {count}
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-lg sm:max-w-lg')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle>{count > 1 ? 'إيصالات الدفع' : 'إيصال الدفع'}</DialogTitle>
            <DialogDescription>
              {orderNumber ? `طلب ${orderNumber}` : 'صور مرفقة مع الطلب'}
              {count > 1 ? ` · ${activeIndex + 1} / ${count}` : null}
            </DialogDescription>
          </div>
          <div className={cn(dialogShellBodyClass, 'space-y-3')}>
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primary}
                alt={`إيصال الدفع ${activeIndex + 1}`}
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            </div>
            {count > 1 ? (
              <div className="flex flex-wrap gap-2">
                {proofUrls.map((item, index) => (
                  <button
                    key={`${item.slice(0, 48)}-${index}`}
                    type="button"
                    className={cn(
                      'h-14 w-14 overflow-hidden rounded-lg border-2 transition-colors',
                      index === activeIndex
                        ? 'border-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                    onClick={() => setActiveIndex(index)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <a href={primary} target="_blank" rel="noopener noreferrer">
                  فتح بحجم كامل
                </a>
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
