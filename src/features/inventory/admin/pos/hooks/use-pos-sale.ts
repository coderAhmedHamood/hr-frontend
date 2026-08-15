'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import type { SaleStockMutationInput } from '@/features/inventory/admin/stock/lib/api/sale-stock-api';
import { posStockQueryKeys } from '@/features/inventory/admin/pos/hooks/use-pos-stock';

export function usePosSaleDeduct(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<SaleStockMutationInput, 'companyId'>) =>
      inventoryStockService.saleDeduct({ ...input, companyId }),
    onSuccess: (result) => {
      const deducted = result.lines.filter((line) => line.status === 'deducted').length;
      const skipped = result.lines.filter((line) => line.status === 'skipped_no_track').length;
      const ref = result.operationReference ?? result.operations[0]?.operationReference;
      toast.success(
        [
          deducted > 0 ? `تم خصم ${deducted} صنف` : null,
          skipped > 0 ? `${skipped} بلا تتبع مخزون` : null,
          ref ? `المرجع: ${ref}` : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'تم تسجيل الخصم',
      );
      void queryClient.invalidateQueries({ queryKey: posStockQueryKeys.all(companyId) });
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'inventory.pos.saleDeduct');
      toast.error(displayMessage);
    },
  });
}
