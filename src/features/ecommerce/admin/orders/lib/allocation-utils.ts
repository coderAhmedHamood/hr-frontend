/** Pure helpers for multi-location order line shipping. */

export type AllocationDraft = {
  warehouseId: string;
  locationId: string;
  quantity: number;
};

export function sumAllocationQty(allocations: Array<{ quantity: number }>): number {
  return allocations.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
}

export function deriveLineShipStatus(
  requiredQty: number,
  allocations: Array<{ quantity: number }>,
  shipped: boolean,
): 'unassigned' | 'assigned' | 'partial' | 'shipped' {
  if (shipped) return 'shipped';
  const total = sumAllocationQty(allocations);
  if (total <= 0) return 'unassigned';
  if (total < requiredQty) return 'partial';
  if (total === requiredQty) return 'assigned';
  return 'partial';
}

export function validateAllocations(
  requiredQty: number,
  allocations: AllocationDraft[],
  availableByLocation: Record<string, number>,
): { ok: boolean; error?: string; total: number } {
  const total = sumAllocationQty(allocations);
  if (allocations.some((row) => !row.locationId || row.quantity <= 0)) {
    return { ok: false, error: 'اختر موقعًا وكمية صحيحة لكل صف.', total };
  }

  const locationCounts = new Map<string, number>();
  for (const row of allocations) {
    locationCounts.set(row.locationId, (locationCounts.get(row.locationId) ?? 0) + row.quantity);
  }
  for (const [locationId, qty] of locationCounts) {
    const available = availableByLocation[locationId] ?? 0;
    if (qty > available) {
      return {
        ok: false,
        error: `الكمية المطلوبة المخصصة تتجاوز المتاح في أحد المواقع (${available}).`,
        total,
      };
    }
  }

  if (total > requiredQty) {
    return { ok: false, error: `المجموع (${total}) يتجاوز المطلوب (${requiredQty}).`, total };
  }
  if (total < requiredQty) {
    return { ok: false, error: `المجموع (${total}) أقل من المطلوب (${requiredQty}).`, total };
  }
  return { ok: true, total };
}
