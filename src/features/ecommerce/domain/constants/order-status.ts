import type { Order, OrderLineShipStatus, OrderStatus } from '@/features/ecommerce/domain/types/order';

/** Full lifecycle from customer request through delivery (+ terminal sides). */
export const ORDER_STATUS_LABELS_AR: Record<OrderStatus, string> = {
  pending: 'طلب جديد',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

/** Line-level fulfilment (`lines[].shipStatus`) — independent of order `status`. */
export const ORDER_LINE_SHIP_STATUS_LABELS_AR: Record<OrderLineShipStatus, string> = {
  unassigned: 'لم يُجهَّز',
  partial: 'تجهيز جزئي',
  assigned: 'جاهز / مخصّص',
  shipped: 'تم الشحن',
};

export const PAYMENT_METHOD_LABELS_AR: Record<
  'cash_on_delivery' | 'cash' | 'bank' | 'network' | 'wallet' | 'card' | 'other',
  string
> = {
  cash_on_delivery: 'كاش عند الاستلام',
  cash: 'نقدي',
  bank: 'تحويل بنكي',
  network: 'شبكة تحويل',
  wallet: 'محفظة إلكترونية',
  card: 'بطاقة',
  other: 'طريقة أخرى',
};

export const PAYMENT_STATUS_LABELS_AR: Record<'pending' | 'paid' | 'failed' | 'refunded', string> = {
  pending: 'بانتظار الدفع',
  paid: 'تم الدفع',
  failed: 'فشل الدفع',
  refunded: 'مسترد',
};

/**
 * Fulfilment statuses only (no payment).
 * Customer places order → confirm → prepare → ship → deliver.
 */
export const ORDER_PIPELINE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

/** Terminal statuses outside the main forward path. */
export const ORDER_TERMINAL_STATUSES: OrderStatus[] = ['cancelled', 'refunded'];

/**
 * Backend-controlled order status transitions (no arbitrary jumps).
 * `shipped` additionally requires every line `shipStatus === 'shipped'`.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'pending', 'cancelled'],
  processing: ['shipped', 'confirmed', 'pending', 'cancelled'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

/** Order statuses that lock line allocations + shipStatus edits. */
export const ORDER_FULFILMENT_LOCKED_STATUSES: readonly OrderStatus[] = [
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

/** Kanban columns: fulfilment pipeline + ملغي. */
export const ORDER_KANBAN_STATUSES: OrderStatus[] = [...ORDER_PIPELINE_STATUSES, 'cancelled'];

export function isOrderFulfilmentLocked(status: OrderStatus): boolean {
  return ORDER_FULFILMENT_LOCKED_STATUSES.includes(status);
}

export function allOrderLinesShipped(
  order: Pick<Order, 'items'>,
): boolean {
  return order.items.length > 0 && order.items.every((line) => line.shipStatus === 'shipped');
}

export function getAllowedOrderStatusTransitions(
  order: Pick<Order, 'status' | 'items' | 'paymentMethod' | 'paymentStatus'>,
): OrderStatus[] {
  const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  return allowed.filter((next) => {
    if (next === 'shipped' && !allOrderLinesShipped(order)) return false;
    return canAdvanceOrderStatus(order, next);
  });
}

export function canTransitionOrderStatus(
  order: Pick<Order, 'status' | 'items' | 'paymentMethod' | 'paymentStatus'>,
  nextStatus: OrderStatus,
): boolean {
  if (order.status === nextStatus) return false;
  return getAllowedOrderStatusTransitions(order).includes(nextStatus);
}

/** True when moving backward on the pipeline or to a terminal cancel/refund. */
export function isOrderStatusNoteRecommended(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (to === 'cancelled' || to === 'refunded') return true;
  const fromIdx = orderPipelineIndex(from);
  const toIdx = orderPipelineIndex(to);
  if (fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx) return true;
  return false;
}

export type OrderFlowStep =
  | { id: string; kind: 'order'; status: OrderStatus; label: string }
  | { id: string; kind: 'payment'; label: string };

/**
 * Sequential path including payment — position depends on method:
 * - شبكة (card): الدفع قبل التأكيد
 * - كاش عند الاستلام: الدفع آخر مرحلة بعد التسليم
 */
export function buildOrderFlowSteps(
  paymentMethod: Order['paymentMethod'] = 'cash_on_delivery',
): OrderFlowStep[] {
  const orderSteps = (statuses: OrderStatus[]): OrderFlowStep[] =>
    statuses.map((status) => ({
      id: `order:${status}`,
      kind: 'order' as const,
      status,
      label: ORDER_STATUS_LABELS_AR[status],
    }));

  const paymentStep = (): OrderFlowStep => ({
    id: 'payment',
    kind: 'payment',
    label:
      paymentMethod === 'card'
        ? `الدفع — ${PAYMENT_METHOD_LABELS_AR.card}`
        : `الدفع — ${PAYMENT_METHOD_LABELS_AR.cash_on_delivery}`,
  });

  if (paymentMethod === 'card') {
    return [
      ...orderSteps(['pending']),
      paymentStep(),
      ...orderSteps(['confirmed', 'processing', 'shipped', 'delivered']),
    ];
  }

  return [...orderSteps([...ORDER_PIPELINE_STATUSES]), paymentStep()];
}

export function isOrderPipelineStatus(status: OrderStatus): boolean {
  return ORDER_PIPELINE_STATUSES.includes(status);
}

export function orderPipelineIndex(status: OrderStatus): number {
  return ORDER_PIPELINE_STATUSES.indexOf(status);
}

export function isPaymentSettled(order: Pick<Order, 'paymentStatus'>): boolean {
  return order.paymentStatus === 'paid';
}

export function resolveOrderPaymentMethod(
  order: Pick<Order, 'paymentMethod'>,
): NonNullable<Order['paymentMethod']> {
  return order.paymentMethod ?? 'cash_on_delivery';
}

export type OrderPrepGuidance = {
  paymentMethod: NonNullable<Order['paymentMethod']>;
  paid: boolean;
  /** Reviewer may move the order into preparation / shipping. */
  canPrepare: boolean;
  methodLabel: string;
  statusLabel: string;
  /** Short line for Kanban / list. */
  prepLabel: string;
  /** Longer hint for order detail. */
  prepHint: string;
};

/** Payment + prep guidance so reviewers know whether to prepare the order. */
export function getOrderPrepGuidance(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus' | 'paymentProofUrl' | 'paymentProofUrls'>,
): OrderPrepGuidance {
  const paymentMethod = resolveOrderPaymentMethod(order);
  const paid = isPaymentSettled(order);
  const methodLabel = PAYMENT_METHOD_LABELS_AR[paymentMethod];
  const statusLabel = PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending'];
  const hasProof = Boolean(
    order.paymentProofUrls?.some((url) => url?.trim()) || order.paymentProofUrl?.trim(),
  );

  if (paymentMethod === 'card') {
    return {
      paymentMethod,
      paid,
      canPrepare: paid,
      methodLabel,
      statusLabel,
      prepLabel: paid
        ? 'جاهز للتجهيز'
        : hasProof
          ? 'راجع إيصال الشبكة'
          : 'انتظر دفع الشبكة',
      prepHint: paid
        ? 'تم الدفع بالشبكة — يمكن تجهيز الطلب وشحنه.'
        : hasProof
          ? 'أرفق العميل صورة التحويل — راجع الإيصال ثم أكّد التحصيل قبل التجهيز.'
          : 'الدفع بالشبكة لم يُؤكَّد بعد — لا تجهّز الطلب قبل التحصيل.',
    };
  }

  return {
    paymentMethod,
    paid,
    canPrepare: true,
    methodLabel,
    statusLabel,
    prepLabel: paid ? 'كاش محصّل' : 'جهّز · التحصيل عند التسليم',
    prepHint: paid
      ? 'تم تحصيل الكاش عند الاستلام.'
      : 'كاش عند الاستلام — جهّز الطلب ويُحصَّل المبلغ عند التسليم.',
  };
}

/** Index of the active step in the payment-aware flow. */
export function getOrderFlowCurrentIndex(order: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus'>): number {
  if (!isOrderPipelineStatus(order.status)) return -1;

  const steps = buildOrderFlowSteps(resolveOrderPaymentMethod(order));
  const paid = isPaymentSettled(order);
  const statusIdx = orderPipelineIndex(order.status);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;

    if (step.kind === 'payment') {
      if (!paid) return i;
      continue;
    }

    const stepIdx = orderPipelineIndex(step.status);
    if (statusIdx < stepIdx) return i;

    if (statusIdx === stepIdx) {
      // شبكة: بعد إنشاء الطلب ننتقل فورًا لخطوة الدفع إن لم تُسدَّد
      const next = steps[i + 1];
      if (step.status === 'pending' && next?.kind === 'payment' && !paid) {
        continue;
      }
      // كاش: بعد التسليم الخطوة الحالية تصبح الدفع إن لم تُحصَّل
      if (step.status === 'delivered' && next?.kind === 'payment' && !paid) {
        continue;
      }
      return i;
    }
  }

  return steps.length - 1;
}

export function getOrderFlowNextStep(
  order: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus'>,
): OrderFlowStep | null {
  if (!isOrderPipelineStatus(order.status)) return null;
  const steps = buildOrderFlowSteps(resolveOrderPaymentMethod(order));
  const current = getOrderFlowCurrentIndex(order);
  if (current < 0 || current >= steps.length - 1) return null;
  return steps[current + 1] ?? null;
}

/** Next fulfilment status only (skips payment). Used by Kanban move buttons. */
export function nextOrderPipelineStatus(status: OrderStatus): OrderStatus | null {
  const index = orderPipelineIndex(status);
  if (index < 0 || index >= ORDER_PIPELINE_STATUSES.length - 1) return null;
  return ORDER_PIPELINE_STATUSES[index + 1]!;
}

/**
 * Card orders must be paid before moving past pending.
 * Combine with `canTransitionOrderStatus` for full backend-aligned checks.
 */
export function canAdvanceOrderStatus(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus'>,
  nextStatus: OrderStatus,
): boolean {
  if (resolveOrderPaymentMethod(order) !== 'card') return true;
  if (isPaymentSettled(order)) return true;
  const nextIdx = orderPipelineIndex(nextStatus);
  // Allow staying on / returning to pending while unpaid; cancel always ok if transition allows
  if (nextStatus === 'cancelled') return true;
  return nextIdx <= orderPipelineIndex('pending');
}
