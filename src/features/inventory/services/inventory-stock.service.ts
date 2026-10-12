/**
 * Sole public entry point for mutating inventory balances.
 *
 * Rule: Sales and any future module must call this service. Warehouse
 * documents change stock only when the server posts them.
 */
import { inventoryStockApi } from '@/features/inventory/admin/stock/lib/api/inventory-stock-api';
import { locationStockApi } from '@/features/inventory/admin/stock/lib/api/location-stock';
import {
  saleStockApi,
  type SaleStockDeductInput,
  type SaleStockMutationInput,
} from '@/features/inventory/admin/stock/lib/api/sale-stock-api';

export const inventoryStockService = {
  /**
   * Preferred sales path — POST /inventory/stock/sale-deduct.
   * Respects trackInventory / variants on the backend.
   */
  async saleDeduct(input: SaleStockDeductInput) {
    return saleStockApi.deduct(input);
  },

  /**
   * Reverse a prior sale deduct — POST /inventory/stock/sale-restore.
   * Prefer same locationId + sourceDocument (orderNumber) as the original deduct.
   */
  async saleRestore(input: SaleStockMutationInput) {
    return saleStockApi.restore(input);
  },

  // ── Reads (safe to call from Sales / UI) ─────────────────────────────────
  getAvailability: locationStockApi.getAvailability.bind(locationStockApi),
  getStockSummary: locationStockApi.getStockSummary.bind(locationStockApi),
  getOnHandTotal: locationStockApi.getOnHandTotal.bind(locationStockApi),
  getOnHandByVariant: locationStockApi.getOnHandByVariant.bind(locationStockApi),
  getQuantityAtLocation: locationStockApi.getQuantityAtLocation.bind(locationStockApi),
  listLocationStock: locationStockApi.list.bind(locationStockApi),
  /** Fast POS list — GET /inventory/stock */
  listStock: inventoryStockApi.list.bind(inventoryStockApi),
  /** Live product stock + locations[] — GET /inventory/products/:id/stock */
  getProductStock: inventoryStockApi.getProductStock.bind(inventoryStockApi),
};
