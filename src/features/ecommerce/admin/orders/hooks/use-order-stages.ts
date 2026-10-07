import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ordersQueryKeys } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import {
  orderStagesApi,
  type OrderStage,
  type SaveOrderStagesSettingsInput,
} from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import {
  addAdminStoreOrderNote,
  assignAdminStoreOrder,
  updateAdminStoreOrderDelivery,
} from '@/features/ecommerce/shared/lib/api/store-orders-api';
import type { Order, UpdateOrderDeliveryInput } from '@/features/ecommerce/domain/types/order';

export const orderStagesQueryKeys = {
  all: ['ecommerce', 'order-stages'] as const,
  settings: (companyId: string) => [...orderStagesQueryKeys.all, 'settings', companyId] as const,
  context: (companyId: string) => [...orderStagesQueryKeys.all, 'context', companyId] as const,
  handlers: (companyId: string, stage: OrderStage) =>
    [...orderStagesQueryKeys.all, 'handlers', companyId, stage] as const,
};

/** What the signed-in user may do on orders; null while unknown (screens then defer to the backend). */
export function useOrderStagesContext(companyId: string) {
  return useQuery({
    queryKey: orderStagesQueryKeys.context(companyId),
    queryFn: () => orderStagesApi.context(companyId),
    enabled: Boolean(companyId),
    staleTime: 60_000,
    retry: false,
  });
}

export function useOrderStageHandlers(companyId: string, stage: OrderStage | null, enabled = true) {
  return useQuery({
    queryKey: orderStagesQueryKeys.handlers(companyId, stage ?? 'pending'),
    queryFn: () => orderStagesApi.handlers(companyId, stage!),
    enabled: Boolean(companyId && stage && enabled),
  });
}

export function useOrderStagesSettings(companyId: string) {
  return useQuery({
    queryKey: orderStagesQueryKeys.settings(companyId),
    queryFn: () => orderStagesApi.settings(companyId),
    enabled: Boolean(companyId),
  });
}

export function useSaveOrderStagesSettings(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveOrderStagesSettingsInput) => orderStagesApi.saveSettings(companyId, input),
    onSuccess: async (settings) => {
      queryClient.setQueryData(orderStagesQueryKeys.settings(companyId), settings);
      await queryClient.invalidateQueries({
        queryKey: orderStagesQueryKeys.all,
      });
      toast.success('تم حفظ إعدادات مراحل الطلبات');
    },
    onError: (err) => handleApiError(err, 'ecommerce.orderStages.save'),
  });
}

function useOrderMutation<V>(
  companyId: string,
  fn: (vars: V) => Promise<Order>,
  success: string,
  context: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (order) => {
      queryClient.setQueryData(ordersQueryKeys.detail(companyId, order.id), order);
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: orderStagesQueryKeys.all,
      });
      toast.success(success);
    },
    onError: (err) => handleApiError(err, context),
  });
}

export function useAssignOrder(companyId: string) {
  return useOrderMutation(
    companyId,
    ({ orderId, assigneeId, note }: { orderId: string; assigneeId: string | null; note?: string | null }) =>
      assignAdminStoreOrder(orderId, assigneeId, note),
    'تم تحديث إسناد الطلب',
    'ecommerce.orders.assign',
  );
}

export function useAddOrderNote(companyId: string) {
  return useOrderMutation(
    companyId,
    ({ orderId, note }: { orderId: string; note: string }) => addAdminStoreOrderNote(orderId, note),
    'أُضيفت الملاحظة إلى سجل الطلب',
    'ecommerce.orders.addNote',
  );
}

export function useUpdateOrderDelivery(companyId: string) {
  return useOrderMutation(
    companyId,
    ({ orderId, input }: { orderId: string; input: UpdateOrderDeliveryInput }) =>
      updateAdminStoreOrderDelivery(orderId, input),
    'تم تحديث بيانات التوصيل',
    'ecommerce.orders.updateDelivery',
  );
}
