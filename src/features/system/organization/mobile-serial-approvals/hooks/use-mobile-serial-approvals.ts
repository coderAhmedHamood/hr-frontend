'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  mobileSerialApprovalsApi,
  type MobileSerialApprovalListQuery,
} from '@/features/system/organization/mobile-serial-approvals/lib/api/mobile-serial-approvals-api';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const mobileSerialApprovalsQueryKeys = {
  all: ['system', 'mobile-serial-approvals'] as const,
  list: (query: MobileSerialApprovalListQuery) =>
    [...mobileSerialApprovalsQueryKeys.all, query] as const,
};

export function useMobileSerialApprovals(
  query: MobileSerialApprovalListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: mobileSerialApprovalsQueryKeys.list(query),
    queryFn: () => mobileSerialApprovalsApi.list(query),
    enabled: enabled && Boolean(query.companyId),
  });
}

function useInvalidateApprovals() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: mobileSerialApprovalsQueryKeys.all });
}

export function useApproveMobileSerial() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: (id: string) => mobileSerialApprovalsApi.approve(id),
    onSuccess: async () => {
      toast.success('تمت الموافقة — سيُرسل إيميل التفعيل للمستخدم');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useRejectMobileSerial() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: (id: string) => mobileSerialApprovalsApi.reject(id),
    onSuccess: async () => {
      toast.success('تم رفض طلب الجهاز');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}
