'use client';

import * as React from 'react';
import { CalendarClock, MessageSquarePlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogMobileFullScreenClass,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAddOrderNote,
  useUpdateOrderDelivery,
} from '@/features/ecommerce/admin/orders/hooks/use-order-stages';
import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { isOrderStage } from '@/features/ecommerce/admin/orders/lib/order-stage-access';
import type { Order, UpdateOrderDeliveryInput } from '@/features/ecommerce/domain/types/order';
import { cn, formatDisplayDate } from '@/shared/utils';

const QUICK_NOTES = [
  'محاولة توصيل: العميل لم يرد',
  'تأجيل التوصيل بطلب العميل',
  'العنوان غير واضح — بانتظار تأكيد العميل',
] as const;

type Props = {
  order: Order;
  companyId: string;
  stages: OrderStagesContext | null | undefined;
};

/** As the backend: orders.update, the assignee, or a handler of the current stage. */
function mayWork(stages: Props['stages'], order: Order): boolean {
  if (!stages) return true;
  if (stages.canUpdate) return true;
  if (order.assignedUserId === stages.userId) return true;
  return isOrderStage(order.status) && stages.stages.includes(order.status);
}

/**
 * Delivery: the recipient, the expected date, correcting them while the
 * order is open, and notes in the trail (delivery attempts…).
 */
export function OrderDeliveryPanel({ order, companyId, stages }: Props) {
  const addNote = useAddOrderNote(companyId);
  const [note, setNote] = React.useState('');
  const [editOpen, setEditOpen] = React.useState(false);
  const allowed = mayWork(stages, order);
  const open = isOrderStage(order.status);

  async function submitNote(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addNote.mutateAsync({ orderId: order.id, note: trimmed });
      setNote('');
    } catch {
      // The error toast is shown by the hook.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">التوصيل</h3>
        {allowed && open ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل بيانات التوصيل
          </Button>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">المستلم</dt>
          <dd className="font-medium">{order.shipFullName ?? order.customerNameAr}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">جوال المستلم</dt>
          <dd className="font-medium" dir="ltr">
            {order.shipPhone ?? order.phone ?? '—'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">العنوان</dt>
          <dd>
            {[order.city, order.shippingDistrict ?? order.region, order.shippingStreet]
              .filter(Boolean)
              .join(' — ') || '—'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            موعد التسليم المتوقع
          </dt>
          <dd>{order.estimatedDeliveryAt ? formatDisplayDate(order.estimatedDeliveryAt) : 'لم يُحدد'}</dd>
        </div>
      </dl>

      {allowed ? (
        <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            ملاحظة في سجل الطلب (داخلية — لا تظهر للعميل)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((quick) => (
              <button
                key={quick}
                type="button"
                disabled={addNote.isPending}
                onClick={() => void submitNote(quick)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {quick}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="اكتب ملاحظة…"
              maxLength={2000}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void submitNote(note);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={!note.trim() || addNote.isPending}
              onClick={() => void submitNote(note)}
            >
              إضافة
            </Button>
          </div>
        </div>
      ) : null}

      <DeliveryEditDialog order={order} companyId={companyId} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function DeliveryEditDialog({
  order,
  companyId,
  open,
  onOpenChange,
}: {
  order: Order;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateOrderDelivery(companyId);
  const initial = React.useMemo(
    () => ({
      shipFullName: order.shipFullName ?? order.customerNameAr,
      shipPhone: order.shipPhone ?? order.phone ?? '',
      shipDistrict: order.shippingDistrict ?? '',
      shipStreet: order.shippingStreet ?? '',
      shipNotes: order.shippingNotes ?? '',
      estimatedDeliveryAt: order.estimatedDeliveryAt?.slice(0, 10) ?? '',
    }),
    [order],
  );
  const [form, setForm] = React.useState(initial);
  React.useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const set =
    (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function save() {
    // Only what changed goes to the server (and into the trail).
    const input: UpdateOrderDeliveryInput = {};
    if (form.shipFullName.trim() !== initial.shipFullName) input.shipFullName = form.shipFullName;
    if (form.shipPhone.trim() !== initial.shipPhone) input.shipPhone = form.shipPhone;
    if (form.shipDistrict.trim() !== initial.shipDistrict) input.shipDistrict = form.shipDistrict;
    if (form.shipStreet.trim() !== initial.shipStreet) input.shipStreet = form.shipStreet;
    if (form.shipNotes.trim() !== initial.shipNotes) input.shipNotes = form.shipNotes.trim() || null;
    if (form.estimatedDeliveryAt !== initial.estimatedDeliveryAt) {
      input.estimatedDeliveryAt = form.estimatedDeliveryAt
        ? new Date(`${form.estimatedDeliveryAt}T12:00:00`).toISOString()
        : null;
    }
    if (Object.keys(input).length === 0) {
      onOpenChange(false);
      return;
    }
    try {
      await update.mutateAsync({ orderId: order.id, input });
      onOpenChange(false);
    } catch {
      // The error toast is shown by the hook.
    }
  }

  const empty =
    !form.shipFullName.trim() ||
    !form.shipPhone.trim() ||
    !form.shipDistrict.trim() ||
    !form.shipStreet.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-lg', dialogMobileFullScreenClass)}>
        <DialogHeader>
          <DialogTitle>تعديل بيانات التوصيل</DialogTitle>
          <DialogDescription>
            تُسجَّل القيم القديمة في سجل الطلب. المدينة ورسوم التوصيل لا تتغير من هنا.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ship-name">اسم المستلم</Label>
            <Input id="ship-name" value={form.shipFullName} onChange={set('shipFullName')} maxLength={255} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ship-phone">جوال المستلم</Label>
            <Input
              id="ship-phone"
              dir="ltr"
              inputMode="tel"
              value={form.shipPhone}
              onChange={set('shipPhone')}
              maxLength={64}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ship-district">الحي</Label>
            <Input
              id="ship-district"
              value={form.shipDistrict}
              onChange={set('shipDistrict')}
              maxLength={160}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ship-street">الشارع</Label>
            <Input id="ship-street" value={form.shipStreet} onChange={set('shipStreet')} maxLength={255} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ship-notes">ملاحظات العنوان</Label>
            <Textarea
              id="ship-notes"
              rows={2}
              value={form.shipNotes}
              onChange={set('shipNotes')}
              maxLength={2000}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ship-eta">موعد التسليم المتوقع (يظهر للعميل)</Label>
            <Input
              id="ship-eta"
              type="date"
              value={form.estimatedDeliveryAt}
              onChange={set('estimatedDeliveryAt')}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="button" disabled={empty || update.isPending} onClick={() => void save()}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
