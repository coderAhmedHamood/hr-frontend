'use client';

import { useQuery } from '@tanstack/react-query';
import {
  listCatalogUoms,
  type CatalogUomListQuery,
} from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';

export function useCatalogUoms(query: CatalogUomListQuery) {
  return useQuery({
    queryKey: ['catalog-uoms', query],
    queryFn: () =>
      listCatalogUoms({
        ...query,
        ensureDefaults: query.ensureDefaults ?? true,
        limit: query.limit ?? 200,
      }),
    enabled: Boolean(query.companyId),
  });
}
