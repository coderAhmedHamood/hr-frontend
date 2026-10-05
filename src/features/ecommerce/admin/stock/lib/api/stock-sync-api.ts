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
  kind: 'enable' | 'manual';
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
