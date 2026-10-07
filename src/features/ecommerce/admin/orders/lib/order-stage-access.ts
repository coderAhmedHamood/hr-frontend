import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_STAGES,
  type OrderStage,
  type OrderStagesContext,
} from '@/features/ecommerce/admin/orders/lib/api/order-stages';

/**
 * The screens' copy of the order-stage rules (the backend decides; this only
 * hides or disables what would be refused, with the reason).
 */
const RANK: Partial<Record<OrderStatus, number>> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

export const ORDER_STAGE_LABELS_AR: Record<OrderStage, string> = {
  pending: 'طلب جديد',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
};

export function isOrderStage(status: OrderStatus): status is OrderStage {
  return (ORDER_STAGES as readonly OrderStatus[]).includes(status);
}

/** Paid when handed over: cash on delivery. */
export function isPaidOnDelivery(method: Order['paymentMethod']): boolean {
  return method === 'cash_on_delivery' || method === 'cash';
}

type OrderRef = Pick<Order, 'status' | 'assignedUserId'>;

function assigneeBlocks(ctx: OrderStagesContext, order: OrderRef): boolean {
  return Boolean(
    ctx.assigneeOnly && order.assignedUserId && order.assignedUserId !== ctx.userId && !ctx.canAssign,
  );
}

/** Why the user may not work on the order now (prepare, move forward); null when they may. */
export function workBlockReason(ctx: OrderStagesContext | null | undefined, order: OrderRef): string | null {
  if (!ctx) return null;
  if (!ctx.enabled) return ctx.canUpdate ? null : 'ليست لديك صلاحية تعديل الطلبات';
  if (!isOrderStage(order.status)) return null;
  if (!ctx.stages.includes(order.status)) {
    return `ليست لديك صلاحية مرحلة «${ORDER_STAGE_LABELS_AR[order.status]}»`;
  }
  if (assigneeBlocks(ctx, order)) return 'الطلب مسند إلى مستخدم آخر';
  return null;
}

/** Why the user may not move the order to `to`; null when they may. */
export function moveBlockReason(
  ctx: OrderStagesContext | null | undefined,
  order: OrderRef,
  to: OrderStatus,
): string | null {
  if (!ctx) return null;
  if (!ctx.enabled) return ctx.canUpdate ? null : 'ليست لديك صلاحية تعديل الطلبات';
  if (to === 'cancelled') return ctx.canCancel ? null : 'ليست لديك صلاحية إلغاء الطلبات';
  if (to === 'refunded') return ctx.canRefund ? null : 'ليست لديك صلاحية استرداد الطلبات';
  if ((RANK[to] ?? 0) < (RANK[order.status] ?? 0)) {
    return ctx.canRollback ? null : 'ليست لديك صلاحية إرجاع الطلب لمرحلة سابقة';
  }
  return workBlockReason(ctx, order);
}

/** May the user assign the order to anyone? */
export function canAssignAnyone(ctx: OrderStagesContext | null | undefined): boolean {
  return Boolean(ctx?.canChooseHandler);
}

/** May the user take this unassigned order (their stage)? */
export function canTakeOrder(ctx: OrderStagesContext | null | undefined, order: OrderRef): boolean {
  if (!ctx || order.assignedUserId || !isOrderStage(order.status)) return false;
  return ctx.stages.includes(order.status) || (!ctx.enabled && ctx.canUpdate);
}
