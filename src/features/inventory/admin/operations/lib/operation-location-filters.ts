import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import type {
  WarehouseLocation,
  WarehouseLocationType,
} from '@/features/inventory/domain/types/warehouse';

/**
 * Real bins that hold the company's stock — never the virtual supplier,
 * customer or loss locations. The server enforces the same rules
 * (`line-location-rules.ts`).
 */
const STOCK_TYPES = new Set<WarehouseLocationType>(['internal', 'transit', 'production']);

const CUSTOMER_DEST_TYPES = new Set<WarehouseLocationType>(['customer']);
const SUPPLIER_DEST_TYPES = new Set<WarehouseLocationType>(['supplier']);

const INBOUND_KINDS = new Set<WarehouseOperationKind>([
  'receipt',
  'purchase',
  'replenishment',
  'opening',
  'customer_return',
]);
const STOCK_SOURCE_KINDS = new Set<WarehouseOperationKind>([
  'issue',
  'scrap',
  'supplier_return',
  'transfer',
  'internal',
]);

/** An already-chosen location stays listed (older drafts) so it is shown, not silently blanked. */
function keepSelected(
  rows: WarehouseLocation[],
  all: WarehouseLocation[],
  keepId?: string,
): WarehouseLocation[] {
  if (!keepId || rows.some((loc) => loc.id === keepId)) return rows;
  const kept = all.find((loc) => loc.id === keepId);
  return kept ? [...rows, kept] : rows;
}

export function filterOperationFromLocations(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
  excludeId?: string,
  keepId?: string,
): WarehouseLocation[] {
  let rows = locations;
  if (STOCK_SOURCE_KINDS.has(kind)) {
    rows = rows.filter((loc) => STOCK_TYPES.has(loc.locationType));
  }
  if (excludeId) {
    rows = rows.filter((loc) => loc.id !== excludeId);
  }
  return keepSelected(rows, locations, keepId);
}

export function filterOperationToLocations(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
  excludeId?: string,
  keepId?: string,
): WarehouseLocation[] {
  let rows = locations;
  if (kind === 'issue') {
    rows = rows.filter((loc) => CUSTOMER_DEST_TYPES.has(loc.locationType));
  } else if (kind === 'supplier_return') {
    rows = rows.filter((loc) => SUPPLIER_DEST_TYPES.has(loc.locationType));
  } else if (
    kind === 'adjustment' ||
    kind === 'physical_count' ||
    INBOUND_KINDS.has(kind) ||
    kind === 'transfer' ||
    kind === 'internal'
  ) {
    rows = rows.filter((loc) => STOCK_TYPES.has(loc.locationType));
  }
  if (excludeId && kind !== 'adjustment' && kind !== 'physical_count') {
    rows = rows.filter((loc) => loc.id !== excludeId);
  }
  return keepSelected(rows, locations, keepId);
}

/** System «Customers / العميل» location created with each warehouse. */
export function findDefaultCustomerLocationId(locations: WarehouseLocation[]): string {
  const system =
    locations.find((loc) => loc.locationType === 'customer' && loc.isSystem) ??
    locations.find((loc) => loc.locationType === 'customer');
  return system?.id ?? '';
}

/** Primary stock bin (WH/Stock) — matches backend `resolveWarehouseStockLocation`. */
export function findDefaultInternalStockLocationId(locations: WarehouseLocation[]): string {
  const active = locations.filter((loc) => loc.isActive !== false);
  const internal = active.filter((loc) => loc.locationType === 'internal');
  const codeOf = (loc: WarehouseLocation) => (loc.code ?? '').trim();
  const pick =
    internal.find((loc) => /^wh\/stock$/i.test(codeOf(loc)) && loc.isSystem) ??
    internal.find((loc) => /^wh\/stock$/i.test(codeOf(loc))) ??
    internal.find((loc) => /^stock$/i.test(codeOf(loc))) ??
    internal.find((loc) => /stock$/i.test(codeOf(loc))) ??
    internal.find((loc) => loc.isSystem) ??
    internal[0];
  return pick?.id ?? '';
}

/** Default «from» when the operation consumes / moves stock from a bin. */
export function pickDefaultFromLocationId(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
): string {
  const pool = filterOperationFromLocations(kind, locations);
  if (pool.length === 0) return '';
  if (
    kind === 'issue' ||
    kind === 'scrap' ||
    kind === 'supplier_return' ||
    kind === 'transfer' ||
    kind === 'internal'
  ) {
    const preferred = findDefaultInternalStockLocationId(pool);
    if (preferred && pool.some((loc) => loc.id === preferred)) return preferred;
  }
  return pool[0]?.id ?? '';
}

/** Default «to» by operation kind (inbound bin, customer, adjustment view, …). */
export function pickDefaultToLocationId(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
  options?: { fromLocationId?: string },
): string {
  const pool = filterOperationToLocations(kind, locations, options?.fromLocationId);
  if (pool.length === 0) return '';

  if (kind === 'issue') {
    const customer = findDefaultCustomerLocationId(pool);
    return customer && pool.some((loc) => loc.id === customer) ? customer : pool[0]?.id ?? '';
  }

  if (kind === 'supplier_return') {
    const system = pool.find((loc) => loc.isSystem) ?? pool[0];
    return system?.id ?? '';
  }

  const stock = findDefaultInternalStockLocationId(pool);
  if (stock && pool.some((loc) => loc.id === stock)) {
    if (
      (kind === 'internal' || kind === 'transfer') &&
      options?.fromLocationId &&
      stock === options.fromLocationId
    ) {
      const alt = pool.find(
        (loc) => loc.locationType === 'internal' && loc.id !== options.fromLocationId,
      );
      return alt?.id ?? '';
    }
    return stock;
  }

  return pool[0]?.id ?? '';
}
