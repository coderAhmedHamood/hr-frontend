import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_STAGES,
  type OrderStage,
  type OrderStageScope,
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

type MoveOrder = Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus'>;

/** Delivering a cash-on-delivery order that is not paid yet: was it collected? */
export function moveAsksCollected(order: MoveOrder, target: OrderStatus): boolean {
  return target === 'delivered' && isPaidOnDelivery(order.paymentMethod) && order.paymentStatus !== 'paid';
}

/**
 * Moves that need input first: cancelling (no way back; a paid order needs
 * the reason), a refund, or delivering an uncollected cash-on-delivery order.
 * Every other move (forward or back) goes in one tap.
 */
export function orderMoveNeedsInput(order: MoveOrder, target: OrderStatus): boolean {
  return target === 'cancelled' || target === 'refunded' || moveAsksCollected(order, target);
}

type OrderRef = Pick<Order, 'status' | 'assignedUserId'>;

function assigneeBlocks(ctx: OrderStagesContext, order: OrderRef): boolean {
  return Boolean(
    ctx.assigneeOnly && order.assignedUserId && order.assignedUserId !== ctx.userId && !ctx.canAssign,
  );
}

/** The user's scope in the order's stage (null: not a member). */
export function stageScopeOf(ctx: OrderStagesContext | null | undefined, stage: OrderStage): OrderStageScope | null {
  if (!ctx) return null;
  return ctx.stageScopes?.[stage] ?? (ctx.stages.includes(stage) ? 'queue' : null);
}

/** Why the user may not work on the order now (prepare, move forward); null when they may. */
export function workBlockReason(ctx: OrderStagesContext | null | undefined, order: OrderRef): string | null {
  if (!ctx) return null;
  if (!ctx.enabled) return ctx.canUpdate ? null : 'ليست لديك صلاحية تعديل الطلبات';
  if (!isOrderStage(order.status)) return null;
  // The supervisor works on any stage and order.
  if (!ctx.isSupervisor) {
    const label = ORDER_STAGE_LABELS_AR[order.status];
    const scope = stageScopeOf(ctx, order.status);
    if (!scope && ctx.viewStages?.includes(order.status)) {
      return `صلاحيتك في مرحلة «${label}» عرض فقط`;
    }
    if (!scope) return `ليست لديك صلاحية على مرحلة «${label}» — تُمنح من إعدادات مراحل الطلبات`;
    if (scope === 'assigned' && order.assignedUserId !== ctx.userId) {
      return `تعمل في مرحلة «${label}» على الطلبات المسندة إليك فقط`;
    }
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

/**
 * May the user assign the order to anyone, or take it off someone else?
 * Stages on: the supervisor only; off: who may edit orders too. (Picking the
 * next stage's handler while moving is `canChooseHandler`.)
 */
export function canAssignAnyone(ctx: OrderStagesContext | null | undefined): boolean {
  if (!ctx) return false;
  return ctx.enabled ? ctx.canAssign : ctx.canUpdate || ctx.canAssign;
}

/**
 * The order statuses the user's order screens show (kanban columns): all
 * of them for who reads every order, or while the stages are off; else the
 * stages they work on or view, in order (closed statuses are hidden).
 * Null while the context is unknown: show nothing conditional yet.
 */
export function visibleOrderStatuses(
  ctx: OrderStagesContext | null | undefined,
  all: readonly OrderStatus[],
): OrderStatus[] | null {
  if (!ctx) return null;
  if (ctx.canReadAll || !ctx.enabled) return [...all];
  const granted = new Set<OrderStatus>([...ctx.stages, ...(ctx.viewStages ?? [])]);
  return all.filter((status) => granted.has(status));
}

/** Is the order in a stage the user only views (no work on it)? */
export function isViewOnlyOrder(ctx: OrderStagesContext | null | undefined, order: OrderRef): boolean {
  if (!ctx || !ctx.enabled || ctx.canUpdate || ctx.isSupervisor || !isOrderStage(order.status)) return false;
  return !stageScopeOf(ctx, order.status) && Boolean(ctx.viewStages?.includes(order.status));
}

/** May the user take this unassigned order? Members who see the stage queue (queue / all). */
export function canTakeOrder(ctx: OrderStagesContext | null | undefined, order: OrderRef): boolean {
  if (!ctx || order.assignedUserId || !isOrderStage(order.status)) return false;
  if (!ctx.enabled) return ctx.canUpdate || ctx.canAssign;
  const scope = stageScopeOf(ctx, order.status);
  return scope === 'queue' || scope === 'all' || ctx.canAssign;
}
