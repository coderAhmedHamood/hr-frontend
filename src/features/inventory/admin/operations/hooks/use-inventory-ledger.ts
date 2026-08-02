'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import type { InventoryLedgerListQuery } from '@/features/inventory/domain/types/inventory-ledger';

export const inventoryLedgerQueryKeys = {
  root: (companyId: string) => [companyId, 'ecommerce', 'inventory-ledger'] as const,
  list: (query: InventoryLedgerListQuery) =>
    [...inventoryLedgerQueryKeys.root(query.companyId), 'list', query] as const,
};

export function useInventoryLedger(query: InventoryLedgerListQuery) {
  return useQuery({
    queryKey: inventoryLedgerQueryKeys.list(query),
    queryFn: () => inventoryLedgerApi.list(query),
    enabled: Boolean(query.companyId),
  });
}
