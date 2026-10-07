import { PosRuleError, posActions, usePosStore } from '@/features/pos/lib/pos-store';
import type { PosSaleLine } from '@/features/pos/domain/types';

/**
 * The POS rules the store enforces as the backend will (pos-study v3): one
 * completion per sale, no charge over the remaining or beside a pending card
 * attempt, no cancel with money in it, returns capped and idempotent, the
 * drain, and the stock posting of returns after the link changes.
 */
const COMPANY = 'company-1';

const line = (quantity: number, total: number): PosSaleLine => ({
  id: 'line-1',
  productId: 'p1',
  variantId: null,
  name: 'صنف',
  variantName: null,
  sku: 'SKU1',
  quantity,
  sourcePrice: total / quantity,
  unitPrice: total / quantity,
  discount: null,
  discountAmount: 0,
  taxRate: 0,
  taxAmount: 0,
  total,
  returnedQuantity: 0,
});

function setup(stockMode: 'none' | 'inventory' = 'none') {
  usePosStore.setState({ companies: {} });
  const a = posActions(COMPANY);
  if (stockMode === 'inventory') {
    a.requestStockModeChange('inventory', 'admin');
    a.confirmStockModeChange('admin');
  }
  const registerId = a.saveRegister({ name: 'الكاشير 1', code: 'POS1', branchId: null, branchName: null, warehouseName: null, isActive: true });
  const sessionId = a.openSession(registerId, 'u1', 'كاشير', 100, 'none');
  const commit = (total = 300, quantity = 3) =>
    a.commitSale({
      registerId,
      sessionId,
      cashierName: 'كاشير',
      stockSource: a.read().settings.stockMode,
      customer: { kind: 'walk_in' },
      lines: [line(quantity, total)],
      orderDiscount: null,
      totals: { subtotal: total, discount: 0, tax: 0, total },
    });
  const pay = (saleId: string, amount: number, method: 'cash' | 'card' = 'cash', status: 'succeeded' | 'pending' = 'succeeded') =>
    a.addPayment(saleId, { kind: 'payment', method, amount, status, reference: null, tendered: null, change: null, sessionId });
  return { a, registerId, sessionId, commit, pay };
}

describe('pos store rules', () => {
  it('completes once: a second call returns the same receipt and does not advance the sequence', () => {
    const { a, commit, pay } = setup();
    const id = commit();
    pay(id, 300);
    const first = a.completeSale(id);
    const second = a.completeSale(id);
    expect(first).toBe('POS1-000001');
    expect(second).toBe(first);
    expect(a.read().registers[0].nextSequence).toBe(2);
  });

  it('does not complete before the total is paid, nor with a pending card attempt', () => {
    const { a, commit, pay } = setup();
    const id = commit();
    pay(id, 100);
    expect(() => a.completeSale(id)).toThrow(PosRuleError);
    pay(id, 200, 'card', 'pending');
    expect(() => a.completeSale(id)).toThrow('معلّقة');
  });

  it('refuses paying over the remaining and a second charge beside a pending attempt', () => {
    const { commit, pay } = setup();
    const id = commit();
    expect(() => pay(id, 301)).toThrow('أكبر من المتبقي');
    pay(id, 100, 'card', 'pending');
    expect(() => pay(id, 100)).toThrow('معلّقة');
  });

  it('does not cancel a sale with money in it until it is refunded', () => {
    const { a, commit, pay, sessionId } = setup();
    const id = commit();
    pay(id, 100);
    expect(() => a.cancelSale(id, 'سبب', 'admin')).toThrow('رده أولًا');
    a.addPayment(id, { kind: 'refund', method: 'cash', amount: 100, status: 'succeeded', reference: null, tendered: null, change: null, sessionId });
    a.cancelSale(id, 'سبب', 'admin');
    expect(a.read().sales[0].status).toBe('cancelled');
  });

  it('caps returns at the sold quantity and gives one effect per key', () => {
    const { a, commit, pay } = setup();
    const id = commit(300, 3);
    pay(id, 300);
    a.completeSale(id);
    const input = (qty: number, key: string) => ({
      operationKey: key,
      saleId: id,
      saleNumber: 'POS1-000001',
      sessionId: null,
      createdBy: 'admin',
      reason: 'اختبار',
      lines: [{ saleLineId: 'line-1', name: 'صنف', quantity: qty, condition: 'resellable' as const, amount: qty * 100 }],
      refund: { method: 'cash' as const, amount: qty * 100, reference: null, status: 'done' as const },
      damagedDecision: null,
    });
    const r1 = a.createReturn(input(2, 'k1'));
    const again = a.createReturn(input(2, 'k1'));
    expect(again.number).toBe(r1.number);
    expect(a.read().returns).toHaveLength(1);
    a.createReturn(input(1, 'k2'));
    expect(() => a.createReturn(input(1, 'k3'))).toThrow('المتبقي للإرجاع 0');
    expect(a.read().sales[0].lines[0].returnedQuantity).toBe(3);
  });

  it('drain: no new shift while a change is under way; confirmed only once drained', () => {
    const { a, registerId, sessionId } = setup();
    a.requestStockModeChange('inventory', 'admin');
    const other = a.saveRegister({ name: 'الكاشير 2', code: 'POS2', branchId: null, branchName: null, warehouseName: null, isActive: true });
    expect(() => a.openSession(other, 'u2', 'كاشير 2', 0, 'none')).toThrow('لا تُفتح ورديات جديدة');
    expect(() => a.confirmStockModeChange('admin')).toThrow('ورديات مفتوحة');
    a.closeSession(sessionId, { countedCash: 100, expectedCash: 100, difference: 0, differenceReason: null, denominationCounts: null }, 'admin');
    a.confirmStockModeChange('admin');
    expect(a.read().settings.stockMode).toBe('inventory');
    expect(a.read().settings.stockModeChange).toBeNull();
    void registerId;
  });

  it('a shift with a sale awaiting payment does not close', () => {
    const { a, commit, sessionId } = setup();
    commit();
    expect(() =>
      a.closeSession(sessionId, { countedCash: 100, expectedCash: 100, difference: 0, differenceReason: null, denominationCounts: null }, 'admin'),
    ).toThrow('بانتظار الدفع');
  });

  it('returns follow the stamped source: inventory sales after unlinking wait as pending stock posting', () => {
    const { a, commit, pay, sessionId } = setup('inventory');
    const id = commit(100, 1);
    pay(id, 100);
    a.completeSale(id);
    expect(a.read().sales[0].stockSource).toBe('inventory');
    // Unlink: close the shift, drain to "none".
    a.closeSession(sessionId, { countedCash: 200, expectedCash: 200, difference: 0, differenceReason: null, denominationCounts: null }, 'admin');
    a.requestStockModeChange('none', 'admin');
    a.confirmStockModeChange('admin');
    const ret = a.createReturn({
      operationKey: 'k-inv',
      saleId: id,
      saleNumber: 'POS1-000001',
      sessionId: null,
      createdBy: 'admin',
      reason: 'اختبار',
      lines: [{ saleLineId: 'line-1', name: 'صنف', quantity: 1, condition: 'resellable', amount: 100 }],
      refund: { method: 'cash', amount: 100, reference: null, status: 'done' },
      damagedDecision: null,
    });
    const stored = a.read().returns.find((r) => r.id === ret.id);
    expect(stored?.stockPosting).toBe('pending');
    a.reviewStockPosting(ret.id, 'admin');
    expect(a.read().returns[0].stockPosting).toBe('reviewed');
  });
});
