import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
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
  } catch {
    return null;
  }
}

export function usePosStockLink(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['pos', 'stock-link', companyId],
    queryFn: () => fetchPosStockLink(companyId!),
    enabled: !!companyId && enabled,
    staleTime: 30_000,
  });
}
