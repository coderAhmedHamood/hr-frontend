import {
  allOrderLinesShipped,
  buildOrderFlowSteps,
  canAdvanceOrderStatus,
  canTransitionOrderStatus,
  getOrderPrepGuidance,
  orderLineShipCounts,
  PAYMENT_METHOD_LABELS_AR,
} from '@/features/ecommerce/domain/constants/order-status';
import type { Order, OrderLineItem } from '@/features/ecommerce/domain/types/order';

/**
 * Kanban cards / list rows come from the list (no lines): the counts the row
 * carries stand for the lines — the "move to shipped" button and the
 * fulfilment badge must read the same as with the full order.
 */
function row(over: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    companyId: 'c1',
    orderNumber: 'ORD-1',
    customerId: 'guest:1',
    customerNameAr: 'عميل',
    status: 'processing',
    items: [],
    isSummary: true,
    totalAmount: { amount: 500, currency: 'YER' },
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'pending',
    ...over,
  };
}

const line = (shipStatus: OrderLineItem['shipStatus']): OrderLineItem => ({
  lineId: `l-${shipStatus}`,
  productId: 'p1',
  productNameAr: 'منتج',
  quantity: 1,
  unitPrice: { amount: 100, currency: 'YER' },
  allocations: [],
  shipStatus,
});

describe('list row line counts', () => {
  it('2 lines, 1 shipped: partial, may not move to shipped', () => {
    const order = row({ lineCount: 2, shippedLineCount: 1 });
    expect(orderLineShipCounts(order)).toEqual({ lines: 2, shipped: 1 });
    expect(allOrderLinesShipped(order)).toBe(false);
    expect(canTransitionOrderStatus(order, 'shipped')).toBe(false);
  });

  it('2 lines, 2 shipped: may move to shipped (as with the full order)', () => {
    const order = row({ lineCount: 2, shippedLineCount: 2 });
    expect(allOrderLinesShipped(order)).toBe(true);
    expect(canTransitionOrderStatus(order, 'shipped')).toBe(true);
    const full = row({ isSummary: false, items: [line('shipped'), line('shipped')] });
    expect(canTransitionOrderStatus(full, 'shipped')).toBe(true);
  });

  it('loaded lines win over stale counts', () => {
    const order = row({ lineCount: 2, shippedLineCount: 0, items: [line('shipped'), line('shipped')] });
    expect(orderLineShipCounts(order)).toEqual({ lines: 2, shipped: 2 });
  });

  it('no lines and no counts (older server): unknown, never shippable', () => {
    expect(orderLineShipCounts(row())).toBeNull();
    expect(allOrderLinesShipped(row())).toBe(false);
  });

  it('a prepaid order with a proof attached (image not loaded) reads "review the proof"', () => {
    const guidance = getOrderPrepGuidance(row({ paymentMethod: 'card', hasPaymentProof: true }));
    expect(guidance.prepLabel).toBe('راجع إثبات الدفع');
    expect(getOrderPrepGuidance(row({ paymentMethod: 'card' })).prepLabel).toBe('بانتظار تأكيد الدفع');
  });

  it('bank, network, wallet and other are prepaid: payment before confirmation', () => {
    for (const paymentMethod of ['bank', 'network', 'wallet', 'other'] as const) {
      const guidance = getOrderPrepGuidance(row({ paymentMethod }));
      expect(guidance.canPrepare).toBe(false);
      expect(guidance.prepLabel).toBe('بانتظار تأكيد الدفع');
      const steps = buildOrderFlowSteps(paymentMethod);
      expect(steps[1]).toEqual({
        id: 'payment',
        kind: 'payment',
        label: `الدفع — ${PAYMENT_METHOD_LABELS_AR[paymentMethod]}`,
      });
      expect(canAdvanceOrderStatus({ paymentMethod, paymentStatus: 'pending' }, 'confirmed')).toBe(
        false,
      );
      expect(canAdvanceOrderStatus({ paymentMethod, paymentStatus: 'paid' }, 'confirmed')).toBe(true);
    }
    for (const paymentMethod of ['cash_on_delivery', 'cash'] as const) {
      const steps = buildOrderFlowSteps(paymentMethod);
      expect(steps[steps.length - 1]?.label).toBe('الدفع — التحصيل عند التسليم');
      expect(canAdvanceOrderStatus({ paymentMethod, paymentStatus: 'pending' }, 'confirmed')).toBe(
        true,
      );
    }
  });
});
