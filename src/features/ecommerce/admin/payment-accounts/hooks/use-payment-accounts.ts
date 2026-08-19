'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  paymentAccountsApi,
  type CreatePaymentAccountInput,
  type PaymentAccountListQuery,
  type UpdatePaymentAccountInput,
} from '@/features/ecommerce/admin/payment-accounts/lib/api/payment-accounts-api';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const paymentAccountsQueryKeys = {
  all: ['ecommerce', 'payment-accounts'] as const,
  list: (companyId: string, query: PaymentAccountListQuery) =>
    [...paymentAccountsQueryKeys.all, companyId, query] as const,
};

export function usePaymentAccounts(
  companyId: string,
  query: PaymentAccountListQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: paymentAccountsQueryKeys.list(companyId, query),
    queryFn: () => paymentAccountsApi.list(companyId, query),
    enabled: enabled && Boolean(companyId),
  });
}

function useInvalidatePaymentAccounts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: paymentAccountsQueryKeys.all });
}

export function useCreatePaymentAccount(companyId: string) {
  const invalidate = useInvalidatePaymentAccounts();
  return useMutation({
    mutationFn: (input: CreatePaymentAccountInput) => paymentAccountsApi.create(companyId, input),
    onSuccess: async () => {
      toast.success('تم إنشاء حساب الدفع');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useUpdatePaymentAccount(companyId: string) {
  const invalidate = useInvalidatePaymentAccounts();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdatePaymentAccountInput }) =>
      paymentAccountsApi.update(companyId, id, patch),
    onSuccess: async () => {
      toast.success('تم تحديث حساب الدفع');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useDeletePaymentAccount(companyId: string) {
  const invalidate = useInvalidatePaymentAccounts();
  return useMutation({
    mutationFn: (id: string) => paymentAccountsApi.remove(companyId, id),
    onSuccess: async () => {
      toast.success('تمت أرشفة حساب الدفع');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useRestorePaymentAccount(companyId: string) {
  const invalidate = useInvalidatePaymentAccounts();
  return useMutation({
    mutationFn: (id: string) => paymentAccountsApi.restore(companyId, id),
    onSuccess: async () => {
      toast.success('تم استرجاع حساب الدفع');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}
