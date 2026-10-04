import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import type {
  WarehouseLocation,
  WarehouseLocationType,
} from '@/features/inventory/domain/types/warehouse';

/** Locations that can hold on-hand stock (source for issue / transfer). */
const STOCK_SOURCE_TYPES = new Set<WarehouseLocationType>([
  'internal',
  'inventory',
  'transit',
  'production',
]);

const CUSTOMER_DEST_TYPES = new Set<WarehouseLocationType>(['customer']);

export function filterOperationFromLocations(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
  excludeId?: string,
): WarehouseLocation[] {
  let rows = locations;
  if (kind === 'issue' || kind === 'scrap') {
    rows = rows.filter((loc) => STOCK_SOURCE_TYPES.has(loc.locationType));
  }
  if (excludeId) {
    rows = rows.filter((loc) => loc.id !== excludeId);
  }
  return rows;
}

export function filterOperationToLocations(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
  excludeId?: string,
): WarehouseLocation[] {
  let rows = locations;
  if (kind === 'issue') {
    rows = rows.filter((loc) => CUSTOMER_DEST_TYPES.has(loc.locationType));
  } else if (excludeId) {
    rows = rows.filter((loc) => loc.id !== excludeId);
  }
  return rows;
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

function findDefaultInventoryAdjustmentLocationId(locations: WarehouseLocation[]): string {
  const active = locations.filter((loc) => loc.isActive !== false);
  return (
    active.find((loc) => loc.locationType === 'inventory' && loc.isSystem)?.id ??
    active.find((loc) => loc.locationType === 'inventory')?.id ??
    ''
  );
}

/** Default «from» when the operation consumes / moves stock from a bin. */
export function pickDefaultFromLocationId(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
): string {
  const pool = filterOperationFromLocations(kind, locations);
  if (pool.length === 0) return '';
  if (kind === 'issue' || kind === 'scrap' || kind === 'transfer' || kind === 'internal') {
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

  if (kind === 'adjustment') {
    const adj = findDefaultInventoryAdjustmentLocationId(pool);
    if (adj && pool.some((loc) => loc.id === adj)) return adj;
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
