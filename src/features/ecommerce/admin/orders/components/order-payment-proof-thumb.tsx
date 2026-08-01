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

type Props = {
  url: string;
  orderNumber?: string;
  /** Compact icon button (Kanban) vs larger preview (detail). */
  size?: 'sm' | 'md';
  className?: string;
};

export function OrderPaymentProofThumb({ url, orderNumber, size = 'sm', className }: Props) {
  const [open, setOpen] = React.useState(false);
  const isSm = size === 'sm';

  return (
    <>
      <button
        type="button"
        className={cn(
          'group relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 text-start transition-colors hover:border-primary/50',
          isSm ? 'h-9 w-9' : 'h-20 w-20',
          className,
        )}
        title="معاينة إيصال الدفع"
        aria-label="معاينة إيصال الدفع"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- data URLs + arbitrary proof hosts */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
        />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-foreground/35 opacity-0 transition-opacity group-hover:opacity-100',
            isSm && 'opacity-100 bg-foreground/25',
          )}
        >
          <ImageIcon className={cn('text-background', isSm ? 'h-3.5 w-3.5' : 'h-5 w-5')} />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-lg sm:max-w-lg')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle>إيصال الدفع</DialogTitle>
            <DialogDescription>
              {orderNumber ? `طلب ${orderNumber}` : 'صورة مرفقة مع الطلب'}
            </DialogDescription>
          </div>
          <div className={cn(dialogShellBodyClass, 'space-y-3')}>
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="إيصال الدفع" className="mx-auto max-h-[70vh] w-full object-contain" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
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
