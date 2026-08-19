'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deliveryRatesApi,
  type CreateDeliveryRateInput,
  type DeliveryRateListQuery,
  type UpdateDeliveryRateInput,
} from '@/features/ecommerce/admin/delivery-rates/lib/api/delivery-rates-api';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const deliveryRatesQueryKeys = {
  all: ['ecommerce', 'delivery-rates'] as const,
  list: (companyId: string, query: DeliveryRateListQuery) =>
    [...deliveryRatesQueryKeys.all, companyId, query] as const,
};

export function useDeliveryRates(
  companyId: string,
  query: DeliveryRateListQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: deliveryRatesQueryKeys.list(companyId, query),
    queryFn: () => deliveryRatesApi.list(companyId, query),
    enabled: enabled && Boolean(companyId),
  });
}

function useInvalidateDeliveryRates() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: deliveryRatesQueryKeys.all });
}

export function useCreateDeliveryRate(companyId: string) {
  const invalidate = useInvalidateDeliveryRates();
  return useMutation({
    mutationFn: (input: CreateDeliveryRateInput) => deliveryRatesApi.create(companyId, input),
    onSuccess: async () => {
      toast.success('تم إنشاء سعر التوصيل');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useUpdateDeliveryRate(companyId: string) {
  const invalidate = useInvalidateDeliveryRates();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateDeliveryRateInput }) =>
      deliveryRatesApi.update(companyId, id, patch),
    onSuccess: async () => {
      toast.success('تم تحديث سعر التوصيل');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useDeleteDeliveryRate(companyId: string) {
  const invalidate = useInvalidateDeliveryRates();
  return useMutation({
    mutationFn: (id: string) => deliveryRatesApi.remove(companyId, id),
    onSuccess: async () => {
      toast.success('تمت أرشفة سعر التوصيل');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useRestoreDeliveryRate(companyId: string) {
  const invalidate = useInvalidateDeliveryRates();
  return useMutation({
    mutationFn: (id: string) => deliveryRatesApi.restore(companyId, id),
    onSuccess: async () => {
      toast.success('تم استرجاع سعر التوصيل');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}
