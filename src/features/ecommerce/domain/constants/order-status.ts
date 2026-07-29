import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';

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

export const PAYMENT_METHOD_LABELS_AR: Record<'cash_on_delivery' | 'card', string> = {
  cash_on_delivery: 'كاش عند الاستلام',
  card: 'شبكة',
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

/** Kanban columns: fulfilment pipeline + ملغي. */
export const ORDER_KANBAN_STATUSES: OrderStatus[] = [...ORDER_PIPELINE_STATUSES, 'cancelled'];

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

/** Index of the active step in the payment-aware flow. */
export function getOrderFlowCurrentIndex(order: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus'>): number {
  if (!isOrderPipelineStatus(order.status)) return -1;

  const steps = buildOrderFlowSteps(order.paymentMethod);
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
  const steps = buildOrderFlowSteps(order.paymentMethod);
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

/** Card orders must be paid before confirmation. */
export function canAdvanceOrderStatus(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus'>,
  nextStatus: OrderStatus,
): boolean {
  if (order.paymentMethod !== 'card') return true;
  if (isPaymentSettled(order)) return true;
  const nextIdx = orderPipelineIndex(nextStatus);
  // Allow staying on / returning to pending while unpaid
  return nextIdx <= orderPipelineIndex('pending');
}
