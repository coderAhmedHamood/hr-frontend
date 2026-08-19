'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { companySuperusersApi } from '@/features/system/organization/contacts/lib/api/company-superusers';

const SUPERUSERS_KEY = ['company-superusers'] as const;

export function useCompanySuperusers(companyId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...SUPERUSERS_KEY, companyId ?? ''],
    queryFn: () => companySuperusersApi.list(companyId!),
    enabled: enabled && Boolean(companyId),
    retry: false,
  });

  const assign = useMutation({
    mutationFn: (userId: string) => companySuperusersApi.assign(companyId!, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPERUSERS_KEY });
      toast.success('تم جعل المستخدم Superuser');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'company-superusers.assign').displayMessage);
    },
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => companySuperusersApi.setActive(companyId!, userId, false),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPERUSERS_KEY });
      toast.success('تم إلغاء Superuser');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'company-superusers.revoke').displayMessage);
    },
  });

  const activeIds = new Set(
    (query.data ?? []).filter((row) => row.isActive !== false).map((row) => row.userId),
  );

  const pendingUserId = assign.isPending
    ? (assign.variables ?? null)
    : revoke.isPending
      ? (revoke.variables ?? null)
      : null;

  return {
    activeIds,
    makeSuperuser: (userId: string) => assign.mutate(userId),
    revokeSuperuser: (userId: string) => revoke.mutate(userId),
    pendingUserId,
  };
}

export function userIsLinkedToCompany(
  companies: Array<{ companyId: string; isActive?: boolean }>,
  companyId: string,
): boolean {
  return companies.some((link) => link.companyId === companyId && link.isActive !== false);
}
