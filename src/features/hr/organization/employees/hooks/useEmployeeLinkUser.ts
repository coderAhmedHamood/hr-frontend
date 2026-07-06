'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { usersApi } from '@/features/hr/organization/lib/api/users';
import type { Employee } from '@/features/hr/organization/employees/types';

export function useEmployeeLinkUser(
  employee: Employee,
  onUserLinked?: (userId: string) => void,
) {
  const qc = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', 'link-picker', 'all'],
    queryFn: () =>
      fetchAllPaginatedItems((page, limit) =>
        usersApi.getAll({ page, limit, archiveScope: 'all' }),
      ),
    staleTime: 60 * 1000,
  });

  const linkUserOptions = React.useMemo(
    () =>
      (usersQuery.data?.items ?? []).map((user) => ({
        value: user.id,
        label: user.fullNameAr || user.fullNameEn || user.email,
        sub: user.employeeId
          ? `${user.email} · مرتبط بموظف`
          : user.email,
      })),
    [usersQuery.data?.items],
  );

  const linkMutation = useMutation({
    mutationFn: (userId: string) =>
      usersApi.update(userId, { employeeId: employee.id }),
    onSuccess: (updated) => {
      toast.success('تم ربط المستخدم بالموظف بنجاح');
      onUserLinked?.(updated.id);
      void qc.invalidateQueries({ queryKey: ['employees'] });
      void qc.invalidateQueries({ queryKey: ['users'] });
      void qc.invalidateQueries({ queryKey: ['user-roles', updated.id] });
      void qc.invalidateQueries({ queryKey: ['user-permissions', updated.id] });
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'employee.linkUser');
      toast.error(displayMessage);
    },
  });

  const handleLinkUser = React.useCallback(
    (userId: string) => {
      if (!userId.trim()) return;
      linkMutation.mutate(userId);
    },
    [linkMutation],
  );

  return {
    linkUserOptions,
    usersLoading: usersQuery.isLoading,
    isLinkingUser: linkMutation.isPending,
    handleLinkUser,
  };
}
