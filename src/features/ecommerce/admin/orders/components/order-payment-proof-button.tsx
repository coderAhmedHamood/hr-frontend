'use client';

import * as React from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
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
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { OrderPaymentProofThumb } from '@/features/ecommerce/admin/orders/components/order-payment-proof-thumb';
import { useOrderDetail } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { resolvePaymentProofUrls } from '@/features/ecommerce/domain/lib/payment-proofs';
import type { Order } from '@/features/ecommerce/domain/types/order';
import { cn } from '@/shared/utils';

type Props = {
  companyId: string;
  order: Pick<
    Order,
    'id' | 'orderNumber' | 'paymentProofUrls' | 'paymentProofUrl' | 'hasPaymentProof'
  >;
  className?: string;
};

/**
 * The payment proof of a list row / kanban card. The list carries only
 * whether one is attached (the image is an inline data URL of up to ~160 KB),
 * so the image is loaded with the order detail when the button is pressed —
 * not one detail request per card on opening the page.
 */
export function OrderPaymentProofButton({ companyId, order, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const loaded = resolvePaymentProofUrls(order);
  const detail = useOrderDetail(companyId, open && loaded.length === 0 ? order.id : null);

  // Already loaded (a detail merged into the row): the usual thumbnail.
  if (loaded.length > 0) {
    return (
      <OrderPaymentProofThumb
        urls={loaded}
        orderNumber={order.orderNumber}
        size="sm"
        className={className}
      />
    );
  }
  if (!order.hasPaymentProof) return null;

  const proofUrls = detail.data ? resolvePaymentProofUrls(detail.data) : [];
  const count = proofUrls.length;
  const primary = proofUrls[Math.min(activeIndex, Math.max(0, count - 1))];

  return (
    <>
      <button
        type="button"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary',
          className,
        )}
        title="معاينة إيصال الدفع"
        aria-label="معاينة إيصال الدفع"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setActiveIndex(0);
          setOpen(true);
        }}
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(dialogShellContentClass, 'max-w-xl sm:max-w-xl')}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={dialogShellHeaderClass}>
            <DialogTitle>{count > 1 ? 'إيصالات الدفع' : 'إيصال الدفع'}</DialogTitle>
            <DialogDescription>
              {`طلب ${order.orderNumber}`}
              {count > 1 ? ` · ${activeIndex + 1} / ${count}` : null}
            </DialogDescription>
          </div>
          <div className={cn(dialogShellBodyClass, 'space-y-3')}>
            {detail.isLoading ? (
              <p className="flex items-center justify-center gap-1.5 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري تحميل الإيصال…
              </p>
            ) : primary ? (
              <>
                <ZoomableImage
                  src={primary}
                  alt={`إيصال الدفع ${activeIndex + 1}`}
                  downloadFileName={`${order.orderNumber}-payment-proof-${activeIndex + 1}.jpg`}
                />
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
                        {/* eslint-disable-next-line @next/next/no-img-element -- data URLs + arbitrary proof hosts */}
                        <img src={item} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="py-10 text-center text-sm text-destructive">
                تعذر تحميل الإيصال — أغلق النافذة وحاول مرة أخرى.
              </p>
            )}
            <div className="flex justify-end gap-2">
              {primary ? (
                <Button type="button" variant="outline" asChild>
                  <a href={primary} target="_blank" rel="noopener noreferrer">
                    فتح بحجم كامل
                  </a>
                </Button>
              ) : null}
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
