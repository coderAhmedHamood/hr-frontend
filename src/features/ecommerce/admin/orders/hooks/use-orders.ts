import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { ordersApi } from '@/features/ecommerce/admin/orders/lib/api/orders';
import type {
  CreateStoreOrderAttachmentInput,
  Order,
  OrderListQuery,
  OrderStatus,
  SaveOrderLineAllocationsInput,
  ShipOrderLineInput,
  UpdateOrderLineShipStatusInput,
  UpdateOrderStaffNoteInput,
  UpdateStoreOrderAttachmentInput,
} from '@/features/ecommerce/domain/types/order';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const ordersQueryKeys = {
  all: ['ecommerce', 'orders'] as const,
  list: (query: OrderListQuery) => [...ordersQueryKeys.all, 'list', query] as const,
  detail: (companyId: string, id: string) => [...ordersQueryKeys.all, 'detail', companyId, id] as const,
};

export const stockAvailabilityQueryKeys = {
  all: ['ecommerce', 'stock-availability'] as const,
  product: (companyId: string, productId: string, variantId: string | null = null) =>
    [...stockAvailabilityQueryKeys.all, companyId, productId, variantId] as const,
};

function syncOrderInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string,
  order: Order,
) {
  queryClient.setQueryData(ordersQueryKeys.detail(companyId, order.id), order);
  queryClient.setQueriesData(
    { queryKey: [...ordersQueryKeys.all, 'list'] },
    (old: PaginatedResult<Order> | undefined) => {
      if (!old?.items) return old;
      const index = old.items.findIndex((item) => item.id === order.id);
      if (index < 0) return old;
      const items = old.items.slice();
      items[index] = { ...items[index], ...order };
      return { ...old, items };
    },
  );
}

export function useOrders(query: OrderListQuery) {
  return useQuery({
    queryKey: ordersQueryKeys.list(query),
    queryFn: () => ordersApi.getAll(query),
    enabled: Boolean(query.companyId),
    // Refresh on tab focus so newly placed orders show up — but only when
    // the data is actually stale (respects the global staleTime), unlike a
    // raw `window.addEventListener('focus', refetch)` which would refetch
    // unconditionally on every focus event.
    refetchOnWindowFocus: true,
  });
}

/** Lightweight list (no detail N+1) — partner profile / filtered summaries. */
export function useOrdersList(query: OrderListQuery, enabled = true) {
  return useQuery({
    queryKey: [...ordersQueryKeys.list(query), 'summary'] as const,
    queryFn: () => ordersApi.list(query),
    enabled: Boolean(query.companyId && enabled),
    refetchOnWindowFocus: true,
  });
}

export function useOrderDetail(companyId: string, orderId: string | null) {
  return useQuery({
    queryKey: ordersQueryKeys.detail(companyId, orderId ?? ''),
    queryFn: () => ordersApi.getById(companyId, orderId!),
    enabled: Boolean(companyId && orderId),
  });
}

export function useProductStockAvailability(
  companyId: string,
  productId: string,
  enabled = true,
  variantId?: string | null,
) {
  const scopedVariantId = variantId ?? null;
  return useQuery({
    queryKey: stockAvailabilityQueryKeys.product(companyId, productId, scopedVariantId),
    queryFn: () =>
      inventoryStockService.getAvailability(companyId, productId, {
        variantId: scopedVariantId,
      }),
    enabled: Boolean(companyId && productId && enabled),
  });
}

export function useUpdateOrderStatus(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      note,
    }: {
      orderId: string;
      status: OrderStatus;
      note?: string | null;
    }) => ordersApi.updateStatus(companyId, orderId, { status, note }),
    onSuccess: async (order, variables) => {
      syncOrderInCaches(queryClient, companyId, order);
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
      await queryClient.invalidateQueries({ predicate: (query) => query.queryKey.includes('location-stock') });
      if (variables.status === 'cancelled' || variables.status === 'refunded') {
        toast.success('تم تحديث الحالة — المخزون يُرجع تلقائياً إن سبق خصمه');
      } else if (variables.status === 'shipped') {
        toast.success('تم الشحن وخصم المخزون');
      } else {
        toast.success('تم تحديث حالة الطلب — ستظهر للعميل في صفحة التتبع');
      }
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.updateStatus');
    },
  });
}

export function useUpdateOrderPaymentStatus(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentStatus,
    }: {
      orderId: string;
      paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    }) => ordersApi.updatePaymentStatus(companyId, orderId, { paymentStatus }),
    onSuccess: async (order) => {
      syncOrderInCaches(queryClient, companyId, order);
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
      toast.success('تم تحديث حالة الدفع');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.updatePaymentStatus');
    },
  });
}

export function useOrderFulfillmentMutations(companyId: string) {
  const queryClient = useQueryClient();

  const invalidate = async (order?: Order) => {
    if (order) syncOrderInCaches(queryClient, companyId, order);
    await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    await queryClient.invalidateQueries({ queryKey: stockAvailabilityQueryKeys.all });
  };

  const saveAllocations = useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: SaveOrderLineAllocationsInput }) =>
      ordersApi.saveLineAllocations(companyId, orderId, input),
    onSuccess: async (order) => {
      await invalidate(order);
      toast.success('تم حفظ توزيع الشحن');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.saveAllocations');
    },
  });

  const shipLine = useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: ShipOrderLineInput }) =>
      ordersApi.shipLine(companyId, orderId, input),
    onSuccess: async (order) => {
      await invalidate(order);
      toast.success('تم شحن الصنف');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.shipLine');
    },
  });

  const updateLineShipStatus = useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: UpdateOrderLineShipStatusInput;
    }) => ordersApi.updateLineShipStatus(companyId, orderId, input),
    onSuccess: async (order, variables) => {
      await invalidate(order);
      toast.success(
        variables.input.shipStatus === 'shipped'
          ? 'تم شحن الصنف'
          : 'تم إرجاع حالة تجهيز الصنف',
      );
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.updateLineShipStatus');
    },
  });

  return { saveAllocations, shipLine, updateLineShipStatus };
}

export function useOrderAttachmentMutations(companyId: string) {
  const queryClient = useQueryClient();

  const invalidate = async (order: Order) => {
    syncOrderInCaches(queryClient, companyId, order);
    await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
  };

  const add = useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: CreateStoreOrderAttachmentInput;
    }) => ordersApi.addAttachment(companyId, orderId, input),
    onSuccess: async (order) => {
      await invalidate(order);
      toast.success('تم إضافة المرفق');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.addAttachment');
    },
  });

  const update = useMutation({
    mutationFn: ({
      orderId,
      attachmentId,
      input,
    }: {
      orderId: string;
      attachmentId: string;
      input: UpdateStoreOrderAttachmentInput;
    }) => ordersApi.updateAttachment(companyId, orderId, attachmentId, input),
    onSuccess: async (order, variables) => {
      await invalidate(order);
      toast.success(
        variables.input.visibleToCustomer === false
          ? 'تم إخفاء المرفق عن العميل'
          : variables.input.visibleToCustomer === true
            ? 'تم إظهار المرفق للعميل'
            : 'تم تحديث المرفق',
      );
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.updateAttachment');
    },
  });

  const remove = useMutation({
    mutationFn: ({ orderId, attachmentId }: { orderId: string; attachmentId: string }) =>
      ordersApi.removeAttachment(companyId, orderId, attachmentId),
    onSuccess: async (order) => {
      await invalidate(order);
      toast.success('تم حذف المرفق');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.removeAttachment');
    },
  });

  return { add, update, remove };
}

export function useUpdateOrderStaffNote(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: UpdateOrderStaffNoteInput;
    }) => ordersApi.updateStaffNote(companyId, orderId, input),
    onSuccess: async (order, variables) => {
      syncOrderInCaches(queryClient, companyId, order);
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
      const cleared =
        variables.input.staffNote !== undefined &&
        (variables.input.staffNote ?? '').trim().length === 0;
      toast.success(
        cleared
          ? 'تم مسح ملاحظة المتجر'
          : variables.input.visibleToCustomer === true
            ? 'تم حفظ الملاحظة وإظهارها للعميل'
            : variables.input.visibleToCustomer === false
              ? 'تم حفظ الملاحظة وإخفاؤها عن العميل'
              : 'تم حفظ ملاحظة المتجر',
      );
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.orders.updateStaffNote');
    },
  });
}
