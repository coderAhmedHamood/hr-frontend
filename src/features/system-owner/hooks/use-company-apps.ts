'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { systemOwnerQueryKeys } from '@/features/system-owner/hooks/query-keys';
import { companyAppsApi } from '@/features/system-owner/lib/api/system-owner';

export function useCompanyAppsCatalog(companyId: string) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.companyAppsCatalog(companyId),
    queryFn: () => companyAppsApi.getCatalog(companyId),
    enabled: Boolean(companyId),
  });
}

export function useCreateAppActivationRequest(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { applicationId: string; message?: string }) =>
      companyAppsApi.createActivationRequest({
        companyId,
        applicationId: payload.applicationId,
        message: payload.message,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: systemOwnerQueryKeys.companyAppsCatalog(companyId),
      });
      toast.success('تم إرسال طلب تفعيل التطبيق');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'company-apps.activation-request').displayMessage);
    },
  });
}

export function useSetApplicationVisibility(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { applicationId: string; isVisible: boolean }) =>
      companyAppsApi.patchApplication(companyId, payload.applicationId, {
        isVisible: payload.isVisible,
      }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: systemOwnerQueryKeys.companyAppsCatalog(companyId),
      });
      toast.success(vars.isVisible ? 'سيظهر التطبيق في المشغّل' : 'تم إخفاء التطبيق من المشغّل');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'company-apps.visibility').displayMessage);
    },
  });
}

export function useCancelAppActivationRequest(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyAppsApi.cancelActivationRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: systemOwnerQueryKeys.companyAppsCatalog(companyId),
      });
      toast.success('تم إلغاء طلب التفعيل');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'company-apps.activation-cancel').displayMessage);
    },
  });
}
