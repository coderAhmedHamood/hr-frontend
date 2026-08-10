import {
  deriveLineShipStatus,
  sumAllocationQty,
  validateAllocations,
} from '@/features/ecommerce/admin/orders/lib/allocation-utils';

describe('allocation-utils', () => {
  it('sums allocation quantities', () => {
    expect(sumAllocationQty([{ quantity: 1 }, { quantity: 2 }])).toBe(3);
  });

  it('derives ship status from coverage', () => {
    expect(deriveLineShipStatus(5, [], false)).toBe('unassigned');
    expect(deriveLineShipStatus(5, [{ quantity: 2 }], false)).toBe('partial');
    expect(deriveLineShipStatus(5, [{ quantity: 5 }], false)).toBe('assigned');
    expect(deriveLineShipStatus(5, [{ quantity: 5 }], true)).toBe('shipped');
  });

  it('validates exact required qty and location availability', () => {
    const available = { 'loc-a': 3, 'loc-b': 2 };
    expect(
      validateAllocations(5, [
        { warehouseId: 'w1', locationId: 'loc-a', quantity: 3 },
        { warehouseId: 'w2', locationId: 'loc-b', quantity: 2 },
      ], available).ok,
    ).toBe(true);

    expect(
      validateAllocations(1, [{ warehouseId: 'w1', locationId: 'loc-a', quantity: 3 }], available).error,
    ).toMatch(/يتجاوز/);

    expect(
      validateAllocations(5, [{ warehouseId: 'w1', locationId: 'loc-a', quantity: 5 }], available).error,
    ).toMatch(/تتجاوز المتاح/);
  });
});
