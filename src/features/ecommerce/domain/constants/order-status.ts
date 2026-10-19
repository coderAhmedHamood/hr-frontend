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

/** Tailwind classes of one status colour (light and dark). */
export type OrderStatusColor = {
  /** Status pill / count badge (list, kanban, stepper chip). */
  badge: string;
  /** Thin strip or dot (kanban column top). */
  strip: string;
  /** Stepper: a step already passed (filled). */
  solid: string;
  /** Stepper: the current step (soft fill + ring). */
  soft: string;
  /** Text in the status colour (step label). */
  text: string;
  /** Kanban column well: a quiet field of the same hue. */
  well: string;
  /** Kanban card: wash, border, and the leading edge. */
  card: string;
};

/**
 * One colour per status, the same in the stepper, the kanban and the list.
 * Neighbouring stages sit far apart on the wheel so a pale wash still reads:
 * new = amber, confirmed = blue, processing = fuchsia, shipped = orange,
 * delivered = green, cancelled = slate, refunded = rose.
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, OrderStatusColor> = {
  pending: {
    badge: 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300',
    strip: 'bg-amber-500',
    solid: 'border-amber-500 bg-amber-500 text-amber-950',
    soft: 'border-amber-500 bg-amber-500/15 text-amber-700 ring-2 ring-amber-500/25 dark:text-amber-300',
    text: 'text-amber-800 dark:text-amber-300',
    well: 'border-border bg-muted/25',
    card: 'border-border bg-card border-s-amber-500 dark:border-s-amber-400',
  },
  confirmed: {
    badge: 'border-blue-500/35 bg-blue-500/10 text-blue-800 dark:text-blue-300',
    strip: 'bg-blue-600',
    solid: 'border-blue-600 bg-blue-600 text-white',
    soft: 'border-blue-500 bg-blue-500/15 text-blue-700 ring-2 ring-blue-500/25 dark:text-blue-300',
    text: 'text-blue-800 dark:text-blue-300',
    well: 'border-border bg-muted/25',
    card: 'border-border bg-card border-s-blue-600 dark:border-s-blue-400',
  },
  processing: {
    badge: 'border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-300',
    strip: 'bg-fuchsia-600',
    solid: 'border-fuchsia-600 bg-fuchsia-600 text-white',
    soft: 'border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-800 ring-2 ring-fuchsia-500/25 dark:text-fuchsia-300',
    text: 'text-fuchsia-800 dark:text-fuchsia-300',
    well: 'border-border bg-muted/25',
    card: 'border-border bg-card border-s-fuchsia-600 dark:border-s-fuchsia-400',
  },
  shipped: {
    badge: 'border-orange-500/35 bg-orange-500/10 text-orange-800 dark:text-orange-300',
    strip: 'bg-orange-500',
    solid: 'border-orange-500 bg-orange-500 text-orange-950',
    soft: 'border-orange-500 bg-orange-500/15 text-orange-800 ring-2 ring-orange-500/25 dark:text-orange-300',
    text: 'text-orange-800 dark:text-orange-300',
    well: 'border-border bg-muted/25',
    card: 'border-border bg-card border-s-orange-500 dark:border-s-orange-400',
  },
  delivered: {
    badge: 'border-green-600/35 bg-green-600/10 text-green-800 dark:text-green-300',
    strip: 'bg-green-600',
    solid: 'border-green-600 bg-green-600 text-white',
    soft: 'border-green-600 bg-green-600/15 text-green-800 ring-2 ring-green-600/25 dark:text-green-300',
    text: 'text-green-800 dark:text-green-300',
    well: 'border-border bg-muted/25',
    card: 'border-border bg-card border-s-green-600 dark:border-s-green-500',
  },
  cancelled: {
    badge: 'border-slate-500/35 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    strip: 'bg-slate-400',
    solid: 'border-slate-500 bg-slate-500 text-white',
    soft: 'border-slate-500 bg-slate-500/15 text-slate-700 ring-2 ring-slate-500/25 dark:text-slate-300',
    text: 'text-slate-600 dark:text-slate-300',
    well: 'border-border bg-muted/25',
    card: 'border-border bg-card border-s-slate-400 dark:border-s-slate-500',
  },
  refunded: {
    badge: 'border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-300',
    strip: 'bg-rose-400',
    solid: 'border-rose-600 bg-rose-600 text-white',
    soft: 'border-rose-500 bg-rose-500/15 text-rose-700 ring-2 ring-rose-500/25 dark:text-rose-300',
    text: 'text-rose-700 dark:text-rose-300',
    well: 'border-border bg-muted/25',
    card: 'border-border bg-card border-s-rose-500 dark:border-s-rose-400',
  },
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

type OrderLinesRef = Pick<Order, 'items' | 'lineCount' | 'shippedLineCount'>;

/**
 * Lines and lines shipped: from the lines when loaded (detail), else from the
 * counts a list row carries (null when neither is known).
 */
export function orderLineShipCounts(
  order: OrderLinesRef,
): { lines: number; shipped: number } | null {
  if (order.items.length > 0) {
    return {
      lines: order.items.length,
      shipped: order.items.filter((line) => line.shipStatus === 'shipped').length,
    };
  }
  if (order.lineCount === undefined) return null;
  return { lines: order.lineCount, shipped: order.shippedLineCount ?? 0 };
}

export function allOrderLinesShipped(order: OrderLinesRef): boolean {
  const counts = orderLineShipCounts(order);
  return Boolean(counts && counts.lines > 0 && counts.shipped === counts.lines);
}

export function getAllowedOrderStatusTransitions(
  order: Pick<Order, 'status' | 'items' | 'lineCount' | 'shippedLineCount' | 'paymentMethod' | 'paymentStatus'>,
): OrderStatus[] {
  const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  return allowed.filter((next) => {
    if (next === 'shipped' && !allOrderLinesShipped(order)) return false;
    return canAdvanceOrderStatus(order, next);
  });
}

export function canTransitionOrderStatus(
  order: Pick<Order, 'status' | 'items' | 'lineCount' | 'shippedLineCount' | 'paymentMethod' | 'paymentStatus'>,
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
 * Paid before delivery (bank, network, wallet, card, other): the payment is
 * confirmed before the order is (server rule). Only cash on delivery / cash
 * are collected at delivery.
 */
export function isPrepaidPaymentMethod(
  paymentMethod: Order['paymentMethod'] | null | undefined,
): boolean {
  const method = paymentMethod ?? 'cash_on_delivery';
  return method !== 'cash_on_delivery' && method !== 'cash';
}

/**
 * Sequential path including payment — position depends on method:
 * - مدفوع مسبقاً (تحويل، شبكة، محفظة، بطاقة، أخرى): الدفع قبل التأكيد
 * - كاش عند الاستلام / نقدي: الدفع آخر مرحلة بعد التسليم
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
    label: isPrepaidPaymentMethod(paymentMethod)
      ? `الدفع — ${PAYMENT_METHOD_LABELS_AR[paymentMethod ?? 'cash_on_delivery']}`
      : 'الدفع — التحصيل عند التسليم',
  });

  if (isPrepaidPaymentMethod(paymentMethod)) {
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
  order: Pick<
    Order,
    'paymentMethod' | 'paymentStatus' | 'paymentProofUrl' | 'paymentProofUrls' | 'hasPaymentProof'
  >,
): OrderPrepGuidance {
  const paymentMethod = resolveOrderPaymentMethod(order);
  const paid = isPaymentSettled(order);
  const methodLabel = PAYMENT_METHOD_LABELS_AR[paymentMethod];
  const statusLabel = PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending'];
  const hasProof = Boolean(
    order.hasPaymentProof ||
      order.paymentProofUrls?.some((url) => url?.trim()) ||
      order.paymentProofUrl?.trim(),
  );

  if (isPrepaidPaymentMethod(paymentMethod)) {
    return {
      paymentMethod,
      paid,
      canPrepare: paid,
      methodLabel,
      statusLabel,
      prepLabel: paid
        ? 'جاهز للتجهيز'
        : hasProof
          ? 'راجع إثبات الدفع'
          : 'بانتظار تأكيد الدفع',
      prepHint: paid
        ? `تم الدفع (${methodLabel}) — يمكن تجهيز الطلب وشحنه.`
        : hasProof
          ? `أرفق العميل إثبات الدفع (${methodLabel}) — راجعه ثم أكّد الدفع قبل تأكيد الطلب.`
          : `الدفع (${methodLabel}) لم يُؤكَّد بعد — لا يُؤكَّد الطلب ولا يُجهَّز قبل تأكيد الدفع.`,
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
 * Prepaid orders (every method but cash on delivery / cash) must be paid
 * before moving past pending — the server refuses it too.
 * Combine with `canTransitionOrderStatus` for full backend-aligned checks.
 */
export function canAdvanceOrderStatus(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus'>,
  nextStatus: OrderStatus,
): boolean {
  if (!isPrepaidPaymentMethod(resolveOrderPaymentMethod(order))) return true;
  if (isPaymentSettled(order)) return true;
  const nextIdx = orderPipelineIndex(nextStatus);
  // Allow staying on / returning to pending while unpaid; cancel always ok if transition allows
  if (nextStatus === 'cancelled') return true;
  return nextIdx <= orderPipelineIndex('pending');
}
