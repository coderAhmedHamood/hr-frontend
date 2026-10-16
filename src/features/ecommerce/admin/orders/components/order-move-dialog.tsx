'use client';

import * as React from 'react';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_STATUS_LABELS_AR,
  isOrderStatusNoteRecommended,
} from '@/features/ecommerce/domain/constants/order-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HANDLER_AUTO,
  HANDLER_KEEP,
  HANDLER_NONE,
  OrderHandlerSelect,
} from '@/features/ecommerce/admin/orders/components/order-handler-select';
import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import {
  ORDER_STAGE_LABELS_AR,
  isOrderStage,
  isPaidOnDelivery,
} from '@/features/ecommerce/admin/orders/lib/order-stage-access';

/** Extra choices of a status move (order stages, delivery). */
export type OrderStatusChangeExtra = {
  /** Who handles the order in the stage it enters; omitted: the settings decide. */
  assigneeId?: string | null;
  paymentCollected?: boolean;
};

type Props = {
  order: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus'>;
  companyId: string;
  stages: OrderStagesContext | null | undefined;
  /** The status being moved to (null: closed). */
  target: OrderStatus | null;
  onCancel: () => void;
  onConfirm: (status: OrderStatus, note: string | null, extra: OrderStatusChangeExtra) => void;
};

/**
 * Confirms a status move: who handles the order in the stage it enters
 * (unchanged / the settings, the stage queue, or a member), whether cash on
 * delivery was collected, and the note kept in the order history.
 */
export function OrderMoveDialog(props: Props) {
  return (
    <Dialog open={Boolean(props.target)} onOpenChange={(open) => (!open ? props.onCancel() : undefined)}>
      <DialogContent className="max-w-md">
        {/* Each opening starts from the defaults. */}
        {props.target ? <MoveForm key={props.target} {...props} target={props.target} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function MoveForm({
  order,
  companyId,
  stages,
  target,
  onCancel,
  onConfirm,
}: Props & { target: OrderStatus }) {
  const [note, setNote] = React.useState('');
  const [handler, setHandler] = React.useState(stages?.enabled ? HANDLER_AUTO : HANDLER_KEEP);
  const [collected, setCollected] = React.useState(true);

  // Whoever may move the order picks the next stage's handler (the backend checks the pick).
  const pickHandler = Boolean(stages?.canChooseHandler && isOrderStage(target));
  const askCollected = Boolean(
    target === 'delivered' && isPaidOnDelivery(order.paymentMethod) && order.paymentStatus !== 'paid',
  );
  // A paid order: the backend needs the reason and how the money goes back.
  const noteRequired = target === 'cancelled' && order.paymentStatus === 'paid';
  const noteRecommended = isOrderStatusNoteRecommended(order.status, target);

  function confirm() {
    const trimmed = note.trim();
    if (noteRequired && !trimmed) return;
    const extra: OrderStatusChangeExtra = {};
    if (pickHandler && handler !== HANDLER_AUTO && handler !== HANDLER_KEEP) {
      extra.assigneeId = handler === HANDLER_NONE ? null : handler;
    }
    if (askCollected && collected) extra.paymentCollected = true;
    onConfirm(target, trimmed || null, extra);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{`تغيير الحالة إلى «${ORDER_STATUS_LABELS_AR[target]}»`}</DialogTitle>
        <DialogDescription>
          {noteRecommended
            ? 'يُفضَّل إضافة ملاحظة عند التراجع أو الإلغاء/الاسترداد.'
            : 'ملاحظة اختيارية تُسجَّل في سجل الطلب.'}
        </DialogDescription>
      </DialogHeader>
      {pickHandler && isOrderStage(target) ? (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            المسؤول في مرحلة «{ORDER_STAGE_LABELS_AR[target]}»
          </p>
          <OrderHandlerSelect
            companyId={companyId}
            stage={target}
            value={handler}
            onChange={setHandler}
            leading={[
              stages?.enabled
                ? { value: HANDLER_AUTO, label: 'حسب إعدادات المرحلة' }
                : { value: HANDLER_KEEP, label: 'دون تغيير' },
            ]}
          />
        </div>
      ) : null}
      {askCollected ? (
        <label className="flex items-start gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 p-3 text-sm">
          <Checkbox
            checked={collected}
            onCheckedChange={(value) => setCollected(value === true)}
            className="mt-0.5"
          />
          <span>
            تم تحصيل المبلغ من العميل عند التسليم
            <span className="block text-xs text-muted-foreground">
              تُسجَّل حالة الدفع «مدفوع» مع التسليم.
            </span>
          </span>
        </label>
      ) : null}
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={
          noteRequired ? 'الطلب مدفوع — سبب الإلغاء وكيف يُعاد المبلغ (مطلوب)' : 'ملاحظة الموظف (اختياري)'
        }
        maxLength={500}
        aria-invalid={noteRequired && !note.trim() ? true : undefined}
      />
      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" className="max-sm:h-11" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="button"
          className="max-sm:h-11"
          onClick={confirm}
          disabled={noteRequired && !note.trim()}
        >
          تأكيد
        </Button>
      </DialogFooter>
    </>
  );
}
