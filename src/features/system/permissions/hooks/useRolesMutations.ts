'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  createRoleWithPermissions,
  updateRoleWithPermissions,
  deleteRoleById,
} from '@/features/system/permissions/services/roles.service';
import { PERMISSIONS_KEYS } from '@/features/system/permissions/hooks/query-keys';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

export type SaveRoleInput = {
  name: string;
  description: string;
  applicationId: string;
  permissionIds: string[];
};

export type UpdateRoleInput = SaveRoleInput & { roleId: string };

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

  function invalidateRoles() {
    void queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEYS.roles });
    void queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEYS.rolePermissionsAll });
  }

  const create = useMutation({
    mutationFn: ({ name, description, applicationId, permissionIds }: SaveRoleInput) => {
      const companyId = resolveCompanyId();
      if (!applicationId) {
        throw new Error('اختر التطبيق الذي ينتمي إليه هذا الدور');
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
