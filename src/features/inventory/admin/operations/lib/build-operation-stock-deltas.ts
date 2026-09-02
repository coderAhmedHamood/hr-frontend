import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { WarehouseOperation, WarehouseOperationLine } from '@/features/inventory/domain/types/warehouse';

export type StockDelta = {
  warehouseId: string;
  locationId: string;
  delta: number;
  counterpartLocationId?: string;
  counterpartWarehouseId?: string;
};

async function findTransitLocationId(companyId: string, warehouseId: string): Promise<string | null> {
  const locations = await warehouseLocationsApi.getAll({ companyId, warehouseId, page: 1, limit: 500 });
  const transit = locations.items.find(
    (location) => location.locationType === 'transit' && location.isActive,
  );
  return transit?.id ?? null;
}

/**
 * Build stock deltas for a validated operation line.
 * Transfers post via Transit: Source → Transit(source WH) → Dest.
 */
export async function buildStockDeltasForLine(
  operation: WarehouseOperation,
  line: WarehouseOperationLine,
): Promise<StockDelta[]> {
  const effect = WAREHOUSE_OPERATION_KIND_META[operation.kind].stockEffect;
  const qty = line.quantity;
  if (qty < 0) return [];

  if (effect === 'inbound') {
    if (!line.toLocationId || qty <= 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta: qty,
      },
    ];
  }

  if (effect === 'outbound') {
    if (!line.fromLocationId || qty <= 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
      },
    ];
  }

  if (effect === 'move') {
    if (!line.fromLocationId || !line.toLocationId || qty <= 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
        counterpartLocationId: line.toLocationId,
        counterpartWarehouseId: operation.warehouseId,
      },
      {
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta: qty,
        counterpartLocationId: line.fromLocationId,
        counterpartWarehouseId: operation.warehouseId,
      },
    ];
  }

  if (effect === 'transfer') {
    if (!line.fromLocationId || !line.toLocationId || qty <= 0) return [];
    const destWarehouseId = operation.destinationWarehouseId || operation.warehouseId;
    const transitId = await findTransitLocationId(operation.companyId, operation.warehouseId);

    if (!transitId) {
      return [
        {
          warehouseId: operation.warehouseId,
          locationId: line.fromLocationId,
          delta: -qty,
          counterpartLocationId: line.toLocationId,
          counterpartWarehouseId: destWarehouseId,
        },
        {
          warehouseId: destWarehouseId,
          locationId: line.toLocationId,
          delta: qty,
          counterpartLocationId: line.fromLocationId,
          counterpartWarehouseId: operation.warehouseId,
        },
      ];
    }

    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
        counterpartLocationId: transitId,
        counterpartWarehouseId: operation.warehouseId,
      },
      {
        warehouseId: operation.warehouseId,
        locationId: transitId,
        delta: qty,
        counterpartLocationId: line.fromLocationId,
        counterpartWarehouseId: operation.warehouseId,
      },
      {
        warehouseId: operation.warehouseId,
        locationId: transitId,
        delta: -qty,
        counterpartLocationId: line.toLocationId,
        counterpartWarehouseId: destWarehouseId,
      },
      {
        warehouseId: destWarehouseId,
        locationId: line.toLocationId,
        delta: qty,
        counterpartLocationId: transitId,
        counterpartWarehouseId: operation.warehouseId,
      },
    ];
  }

  if (effect === 'adjust_set') {
    if (!line.toLocationId) return [];
    const theoretical = line.demandQuantity ?? 0;
    const counted = line.quantity;
    const delta = counted - theoretical;
    if (delta === 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta,
      },
    ];
  }

  return [];
}
