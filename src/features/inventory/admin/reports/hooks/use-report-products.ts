import { useQuery } from '@tanstack/react-query';
import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ReportProduct = {
  id: string;
  nameAr: string;
  sku: string;
  trackInventory: boolean;
  lowStockThreshold: number;
};

type ProductRow = {
  id: string;
  nameAr: string;
  sku: string;
  trackInventory?: boolean | null;
  lowStockThreshold?: string | number | null;
};

/** Every active product of the company (no media, no page cap) for stock reports. */
export function useReportProducts(companyId: string) {
  return useQuery({
    queryKey: ['inventory', 'report-products', companyId],
    enabled: Boolean(companyId),
    staleTime: 60_000,
    queryFn: async (): Promise<ReportProduct[]> => {
      const items: ReportProduct[] = [];
      for (let page = 1; ; page += 1) {
        const result = await apiRequest<PaginatedResult<ProductRow>>('/inventory/products', {
          query: { companyId, page, limit: 500, archiveScope: 'active' },
          throwOnError: true,
        });
        for (const row of result.items ?? []) {
          items.push({
            id: row.id,
            nameAr: row.nameAr,
            sku: row.sku,
            trackInventory: row.trackInventory ?? true,
            lowStockThreshold: Number(row.lowStockThreshold ?? 0),
          });
        }
        if (page >= (result.pagination?.totalPages ?? 1)) return items;
      }
    },
  });
}
