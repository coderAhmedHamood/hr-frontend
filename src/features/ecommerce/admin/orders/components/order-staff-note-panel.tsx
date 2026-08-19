'use client';

import * as React from 'react';
import { Eye, EyeOff, Loader2, StickyNote } from 'lucide-react';
import { useUpdateOrderStaffNote } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { useCan } from '@/features/auth/hooks/use-can';
import type { Order } from '@/features/ecommerce/domain/types/order';
import { cn } from '@/shared/utils';

const ORDERS_UPDATE_PERMISSION = 'sta.orders.update';
const MAX_STAFF_NOTE = 4000;

export function OrderStaffNotePanel({
  order,
  companyId,
}: {
  order: Order;
  companyId: string;
}) {
  const can = useCan();
  const canManage = can(ORDERS_UPDATE_PERMISSION);
  const mutation = useUpdateOrderStaffNote(companyId);

  const initialNote = order.staffNote ?? '';
  const initialVisible = order.staffNoteVisibleToCustomer ?? false;
  const [note, setNote] = React.useState(initialNote);
  const [visible, setVisible] = React.useState(initialVisible);

  // Re-sync when the order (or its note) changes from the server.
  React.useEffect(() => {
    setNote(order.staffNote ?? '');
    setVisible(order.staffNoteVisibleToCustomer ?? false);
  }, [order.id, order.staffNote, order.staffNoteVisibleToCustomer]);

  const trimmed = note.trim();
  const dirty = trimmed !== initialNote.trim() || visible !== initialVisible;
  // Clearing the note forces visibility off (backend does this automatically).
  const effectiveVisible = trimmed.length === 0 ? false : visible;

  async function handleSave() {
    if (!canManage || mutation.isPending || !dirty) return;
    await mutation.mutateAsync({
      orderId: order.id,
      input: {
        staffNote: trimmed.length === 0 ? '' : trimmed,
        visibleToCustomer: effectiveVisible,
      },
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">ملاحظة المتجر</h3>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              effectiveVisible
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
            )}
          >
            {effectiveVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {effectiveVisible ? 'مرئية للعميل' : 'داخلية'}
          </span>
        </div>
      </div>

      {canManage ? (
        <>
          <textarea
            value={note}
            maxLength={MAX_STAFF_NOTE}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            dir="auto"
            placeholder="اكتب ملاحظة تخص هذا الطلب…"
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label
              className={cn(
                'inline-flex items-center gap-2 text-xs',
                trimmed.length === 0
                  ? 'cursor-not-allowed text-muted-foreground/60'
                  : 'cursor-pointer text-muted-foreground',
              )}
            >
              <input
                type="checkbox"
                checked={effectiveVisible}
                disabled={trimmed.length === 0}
                onChange={(event) => setVisible(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-primary"
              />
              إظهار الملاحظة للعميل في صفحة تتبّع الطلب
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {note.length}/{MAX_STAFF_NOTE}
              </span>
              <button
                type="button"
                disabled={!dirty || mutation.isPending}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                حفظ
              </button>
            </div>
          </div>
        </>
      ) : order.staffNote ? (
        <p className="whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-foreground" dir="auto">
          {order.staffNote}
        </p>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          لا توجد ملاحظة على هذا الطلب.
        </p>
      )}
    </div>
  );
}
