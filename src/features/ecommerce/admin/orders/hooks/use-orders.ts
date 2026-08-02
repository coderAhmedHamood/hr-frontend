import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { ordersApi } from '@/features/ecommerce/admin/orders/lib/api/orders';
import type { OrderListQuery, SaveOrderLineAllocationsInput, ShipOrderLineInput } from '@/features/ecommerce/domain/types/order';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const ordersQueryKeys = {
  all: ['ecommerce', 'orders'] as const,
  list: (query: OrderListQuery) => [...ordersQueryKeys.all, 'list', query] as const,
  detail: (companyId: string, id: string) => [...ordersQueryKeys.all, 'detail', companyId, id] as const,
};

export const stockAvailabilityQueryKeys = {
  all: ['ecommerce', 'stock-availability'] as const,
  product: (companyId: string, productId: string) =>
    [...stockAvailabilityQueryKeys.all, companyId, productId] as const,
};

export function useOrders(query: OrderListQuery) {
  return useQuery({
    queryKey: ordersQueryKeys.list(query),
    queryFn: () => ordersApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}

export function useProductStockAvailability(companyId: string, productId: string, enabled = true) {
  return useQuery({
    queryKey: stockAvailabilityQueryKeys.product(companyId, productId),
    queryFn: () => inventoryStockService.getAvailability(companyId, productId),
    enabled: Boolean(companyId && productId && enabled),
  });
}

export function useOrderFulfillmentMutations(companyId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    await queryClient.invalidateQueries({ queryKey: stockAvailabilityQueryKeys.all });
  };

  const saveAllocations = useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: SaveOrderLineAllocationsInput }) =>
      ordersApi.saveLineAllocations(companyId, orderId, input),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم حفظ توزيع الشحن');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.saveAllocations');
    },
  });

  const shipLine = useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: ShipOrderLineInput }) =>
      ordersApi.shipLine(companyId, orderId, input),
    onSuccess: async () => {
      await invalidate();
      toast.success('تم شحن المنتج وخصم الكمية من المواقع');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.shipLine');
    },
  });

  return { saveAllocations, shipLine };
}
