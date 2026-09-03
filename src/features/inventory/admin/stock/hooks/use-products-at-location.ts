import { useQuery } from '@tanstack/react-query';
import { locationStockApi } from '@/features/inventory/admin/stock/lib/api/location-stock';
import type { ProductOption } from '@/features/ecommerce/admin/products/lib/api/product-options';

export type LocationProductOption = ProductOption & {
  available: number;
};

/**
 * Catalog rows that currently have on-hand at a warehouse location.
 * Used so a transfer/move picker cannot offer stock that lives elsewhere.
 */
export function useProductsAtLocation(
  companyId: string,
  locationId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [companyId, 'ecommerce', 'location-stock', 'products-at', locationId] as const,
    queryFn: async (): Promise<LocationProductOption[]> => {
      const rows = await locationStockApi.list({
        companyId,
        locationId,
      });
      const byProduct = new Map<string, LocationProductOption>();
      for (const row of rows) {
        const available = Math.max(0, row.quantity - (row.reservedQuantity ?? 0));
        if (available <= 1e-9) continue;
        const existing = byProduct.get(row.productId);
        if (existing) {
          existing.available += available;
          continue;
        }
        byProduct.set(row.productId, {
          id: row.productId,
          nameAr: row.productNameAr ?? '',
          sku: row.productSku ?? '',
          status: 'active',
          available,
        });
      }
      return [...byProduct.values()].sort((a, b) =>
        a.nameAr.localeCompare(b.nameAr, 'ar'),
      );
    },
    enabled:
      Boolean(companyId && locationId) && (options?.enabled ?? true),
  });
}
