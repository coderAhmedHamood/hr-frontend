import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/shared/api/client';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { companyHasApp, POS_STOCK_SYNC_APP_CODE } from '@/shared/modules/registry';

const INVENTORY_APP_CODE = 'inventory';
import type { PosStockMode, PosStockTiming } from '@/features/pos/domain/types';

/** The point of sale–inventory link (pos-stock-sync bridge) as the POS screens see it. */
export type PosStockLinkState = {
  /** The bridge is in this build (registers may choose a warehouse). */
  installed: boolean;
  /** Enabled for the company: every register sells from its warehouse. */
  enabled: boolean;
  stockMode: PosStockMode;
  stockTiming: PosStockTiming;
  openShifts: number;
  registers: Array<{
    id: string;
    name: string;
    branchId: string | null;
    isActive: boolean;
    warehouseId: string | null;
    warehouseName: string | null;
  }>;
  /** Warehouses a register may sell from (one of its branch). */
  warehouses: Array<{ id: string; code: string; nameAr: string; branchId: string | null }>;
  openReservations: number;
};

/** Null when the bridge is not in this build (the route does not exist). */
export async function fetchPosStockLink(companyId: string): Promise<PosStockLinkState | null> {
  try {
    return await apiRequest<PosStockLinkState>('/pos/stock-link', {
      query: { companyId },
      throwOnError: true,
      silent: true,
    });
  } catch (error) {
    // Any other failure is not "not installed": the screen shows it.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * The link as the POS screens see it. Warehouses are inventory's, so nothing
 * is asked for (or shown) while inventory is disabled for the company;
 * `bridgeOn` is the «ربط نقاط البيع بالمخازن» app itself.
 */
export function usePosStockLink(companyId: string | null | undefined, enabled = true) {
  const context = useModuleEnablementContext();
  const inventoryOn = companyHasApp(INVENTORY_APP_CODE, context);
  const bridgeOn = companyHasApp(POS_STOCK_SYNC_APP_CODE, context);
  const query = useQuery({
    queryKey: ['pos', 'stock-link', companyId],
    queryFn: () => fetchPosStockLink(companyId!),
    enabled: !!companyId && enabled && inventoryOn,
    staleTime: 30_000,
  });
  return Object.assign(query, { inventoryOn, bridgeOn });
}
