'use client';

import * as React from 'react';
import { ArrowLeftRight, Loader2, Pencil, Plus, Store } from 'lucide-react';
import { useUpdateOrderStaffNote } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { useCan } from '@/features/auth/hooks/use-can';
import type { Order } from '@/features/ecommerce/domain/types/order';
import { cn } from '@/shared/utils';

const ORDERS_UPDATE_PERMISSION = 'sta.orders.update';
const MAX_STAFF_NOTE = 4000;

export type StaffNoteAudience = 'customer' | 'internal';

const AUDIENCE_COPY: Record<
  StaffNoteAudience,
  { title: string; add: string; placeholder: string; moveTo: string }
> = {
  customer: {
    title: 'رسالة المتجر للعميل',
    add: 'اكتب رسالة تظهر للعميل',
    placeholder: 'تظهر للعميل في صفحة تتبّع الطلب…',
    moveTo: 'إخفاء عن العميل (نقل للداخلي)',
  },
  internal: {
    title: 'ملاحظة المتجر الداخلية',
    add: 'اكتب ملاحظة داخلية مثبّتة',
    placeholder: 'للفريق فقط — لا يراها العميل…',
    moveTo: 'إظهار للعميل',
  },
};

/**
 * The order's single store note. It lives in the section of its audience:
 * shown to the customer, or kept internal. Each section renders its own
 * instance; only the one matching the saved visibility shows the note.
 */
export function OrderStaffNotePanel({
  order,
  companyId,
  audience,
}: {
  order: Order;
  companyId: string;
  audience: StaffNoteAudience;
}) {
  const can = useCan();
  const canManage = can(ORDERS_UPDATE_PERMISSION);
  const mutation = useUpdateOrderStaffNote(companyId);
  const copy = AUDIENCE_COPY[audience];

  const saved = order.staffNote?.trim() ?? '';
  const savedAudience: StaffNoteAudience = order.staffNoteVisibleToCustomer ? 'customer' : 'internal';
  const ownsNote = saved.length > 0 && savedAudience === audience;
  const otherSectionOwnsNote = saved.length > 0 && savedAudience !== audience;

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(saved);

  React.useEffect(() => {
    setEditing(false);
    setDraft(order.staffNote ?? '');
  }, [order.id, order.staffNote, order.staffNoteVisibleToCustomer]);

  const trimmed = draft.trim();

  async function save(text: string, visibleToCustomer: boolean) {
    if (!canManage || mutation.isPending) return;
    await mutation.mutateAsync({
      orderId: order.id,
      input: { staffNote: text, visibleToCustomer: text.length > 0 && visibleToCustomer },
    });
    setEditing(false);
  }

  // The note sits in the other section; this one only offers to add when empty.
  if (otherSectionOwnsNote) return null;

  if (editing && canManage) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">{copy.title}</p>
        <textarea
          value={draft}
          maxLength={MAX_STAFF_NOTE}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          dir="auto"
          autoFocus
          placeholder={copy.placeholder}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="me-auto text-[11px] tabular-nums text-muted-foreground">
            {draft.length}/{MAX_STAFF_NOTE}
          </span>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setDraft(order.staffNote ?? '');
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={trimmed === saved || mutation.isPending}
            onClick={() => void save(trimmed, audience === 'customer')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {trimmed.length === 0 && saved.length > 0 ? 'مسح الملاحظة' : 'حفظ'}
          </button>
        </div>
      </div>
    );
  }

  if (!ownsNote) {
    return canManage ? (
      <button
        type="button"
        onClick={() => {
          setDraft('');
          setEditing(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        {copy.add}
      </button>
    ) : null;
  }

  return (
    <div className="rounded-xl border border-border/70 bg-background p-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
          <Store className="h-3.5 w-3.5 text-muted-foreground" />
          {copy.title}
        </span>
        {canManage ? (
          <div className="ms-auto flex items-center gap-1">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => void save(saved, audience !== 'customer')}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <ArrowLeftRight className="h-3 w-3" />
              {copy.moveTo}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(order.staffNote ?? '');
                setEditing(true);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
              تعديل
            </button>
          </div>
        ) : null}
      </div>
      <p className={cn('whitespace-pre-wrap text-sm text-foreground')} dir="auto">
        {saved}
      </p>
      {audience === 'customer' ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          تظهر للعميل في صفحة تتبّع الطلب، بعنوان «ملاحظة من المتجر».
        </p>
      ) : null}
    </div>
  );
}
