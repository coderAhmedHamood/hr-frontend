'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MapPinned } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { usePutawayRules } from '@/features/inventory/admin/putaway-rules/hooks/use-putaway-rules';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productNameAr: string;
  /** Bumped on each sidebar click so rules refetch. */
  requestKey?: number;
};

export function ProductPutawayRulesDialog({
  open,
  onOpenChange,
  productId,
  productNameAr,
  requestKey = 0,
}: Props) {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const skipNextRefetch = React.useRef(true);

  const { data, isLoading, isFetching, refetch } = usePutawayRules(
    { companyId, productId, limit: 100 },
    { enabled: open, refetchOnOpen: true },
  );

  React.useEffect(() => {
    if (!open) {
      skipNextRefetch.current = true;
      return;
    }
    if (skipNextRefetch.current) {
      skipNextRefetch.current = false;
      return;
    }
    void refetch();
  }, [open, requestKey, refetch]);

  const items = data?.items ?? [];
  const busy = isLoading || isFetching;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-2xl sm:max-w-2xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <MapPinned className="h-4 w-4 text-primary" />
            قواعد التخزين · {productNameAr}
          </DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            قواعد وضع المنتج في المواقع بعد الاستلام.
          </p>
        </div>

        <div className={cn(dialogShellBodyClass, 'space-y-3')}>
          {busy ? (
            <p className="text-sm text-muted-foreground">جاري التحميل…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              لا توجد قواعد تخزين لهذا المنتج بعد.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((rule) => (
                <li
                  key={rule.id}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm"
                >
                  <p className="font-medium text-foreground">
                    تسلسل {rule.sequence} · {rule.appliesTo}
                    {!rule.isActive ? ' · غير نشط' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    store: {rule.storeLocationId.slice(0, 8)}…
                    {rule.subLocationId ? ` / ${rule.subLocationId.slice(0, 8)}…` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push(`${ecommerceAdminRoutes.putawayRules}?productId=${productId}`);
            }}
          >
            فتح قائمة القواعد
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
