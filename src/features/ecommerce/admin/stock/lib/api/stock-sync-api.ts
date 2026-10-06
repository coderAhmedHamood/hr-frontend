import { apiRequest } from '@/features/hr/lib/api/client';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

/**
 * Reconciliation of the store with inventory (phase 4, store-stock-sync):
 * written when the link is enabled for the company, or on demand.
 */
export type StockSyncItem = {
  productId: string;
  variantId: string | null;
  name: string;
  tracked: boolean;
  /** The store's own quantity before the link, when it had one. */
  localQuantity: number | null;
  onHand: number;
  reserved: number;
  available: number;
  /** localQuantity − available. */
  difference: number | null;
};

export type StockSyncReport = {
  generatedAt: string;
  items: StockSyncItem[];
  totals: {
    items: number;
    tracked: number;
    withLocalQuantity: number;
    mismatched: number;
    outOfStock: number;
  };
  openLocalOrders: number;
};

export type StockSyncRun = {
  id: string;
  kind: 'enable' | 'manual' | 'disable';
  createdAt: string;
  createdBy: string | null;
  report: StockSyncReport;
};

const base = (companyId: string) =>
  `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/stock-sync/reconciliations`;

export const stockSyncApi = {
  async list(companyId: string): Promise<{ enabled: boolean; runs: StockSyncRun[] }> {
    return apiRequest<{ enabled: boolean; runs: StockSyncRun[] }>(base(companyId), {
      throwOnError: true,
    });
  },

  async run(companyId: string): Promise<StockSyncReport & { id: string }> {
    return apiRequest<StockSyncReport & { id: string }>(base(companyId), {
      method: 'POST',
      throwOnError: true,
    });
  },
};

export type StockSyncShortfall = {
  productId: string;
  variantId: string | null;
  warehouseId: string;
  sellable: number;
  reserved: number;
  missing: number;
  /** Order numbers whose reservation is not covered (oldest are covered first). */
  uncoveredOrders: string[];
};

export type StockSyncStatus = {
  enabled: boolean;
  state: 'active' | 'draining';
  warehouseId: string | null;
  warehouseNameAr: string | null;
  needsWarehouse: boolean;
  warehouses: Array<{ id: string; code: string; nameAr: string }>;
  openReservations: number;
  openInventoryOrders: number;
  unresolvedOrders: Array<{ id: string; orderNumber: string; status: string; createdAt: string }>;
  shortfalls: StockSyncShortfall[];
  localState: 'ready' | 'needs_opening';
  canDisable: boolean;
};

const statusBase = (companyId: string) =>
  `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/stock-sync`;

export const stockSyncStatusApi = {
  get(companyId: string): Promise<StockSyncStatus> {
    return apiRequest<StockSyncStatus>(statusBase(companyId), { throwOnError: true });
  },
  setWarehouse(companyId: string, warehouseId: string): Promise<StockSyncStatus> {
    return apiRequest<StockSyncStatus>(`${statusBase(companyId)}/settings`, {
      method: 'PUT',
      throwOnError: true,
      body: { warehouseId },
    });
  },
  drain(companyId: string): Promise<StockSyncStatus> {
    return apiRequest<StockSyncStatus>(`${statusBase(companyId)}/drain`, {
      method: 'POST',
      throwOnError: true,
    });
  },
  resume(companyId: string): Promise<StockSyncStatus> {
    return apiRequest<StockSyncStatus>(`${statusBase(companyId)}/resume`, {
      method: 'POST',
      throwOnError: true,
    });
  },
};

/** Does the store sell from inventory, and from which warehouse (readable with shop-sales permissions too). */
export function fetchStoreWarehouse(
  companyId: string,
): Promise<{ enabled: boolean; warehouseId: string | null }> {
  return apiRequest<{ enabled: boolean; warehouseId: string | null }>(
    `${statusBase(companyId)}/store-warehouse`,
    { throwOnError: true },
  );
}
