'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useApplicationId } from '@/features/hr/permissions/hooks/useApplicationId';
import { usePermissions } from '@/features/hr/permissions/hooks/usePermissions';
import {
  createRoleWithPermissions,
  updateRoleWithPermissions,
  deleteRoleById,
} from '@/features/hr/permissions/services/roles.service';

export type SaveRoleInput = {
  name: string;
  description: string;
  permissionIds: string[];
};

export type UpdateRoleInput = SaveRoleInput & { roleId: string };

import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

function resolveCompanyId(): string {
  const { accessProfile } = useAuthStore.getState();
  return (
    getDefaultCompanyId()
    ?? accessProfile?.companies[0]?.companyId
    ?? ''
  );
}

export function useRolesMutations() {
  const queryClient = useQueryClient();
  const userEmail = useAuthStore((s) => s.user?.email ?? null);
  const { applicationId: appFromApi } = useApplicationId();
  const { data: permissionsResult } = usePermissions(appFromApi);
  const applicationId = permissionsResult?.applicationId ?? appFromApi;

  function invalidateRoles() {
    void queryClient.invalidateQueries({ queryKey: ['roles'] });
    void queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
  }

  const create = useMutation({
    mutationFn: ({ name, description, permissionIds }: SaveRoleInput) => {
      const companyId = resolveCompanyId();
      if (!applicationId) {
        throw new Error('تعذّر تحديد تطبيق HR — تأكد من تحميل قائمة الصلاحيات');
      }
      if (!companyId) {
        throw new Error('لم يتم تحديد الشركة النشطة — اختر شركة من القائمة العلوية');
      }
      return createRoleWithPermissions({
        name,
        description,
        permissionIds,
        companyId,
        applicationId,
        createdBy: userEmail,
      });
    },
    onSuccess: invalidateRoles,
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'roles.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ roleId, name, description, permissionIds }: UpdateRoleInput) =>
      updateRoleWithPermissions(roleId, {
        name,
        description,
        permissionIds,
        createdBy: userEmail,
      }),
    onSuccess: invalidateRoles,
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'roles.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: (roleId: string) => deleteRoleById(roleId),
    onSuccess: invalidateRoles,
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'roles.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
