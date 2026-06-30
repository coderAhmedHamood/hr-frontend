'use client';

import { useUserRolesPermissionsModel } from '@/features/hr/permissions/hooks/use-user-roles-permissions-model';
import { resolveEmployeeCompanyId } from '@/features/hr/organization/employees/services/employee-company.service';
import type { Employee } from '@/features/hr/organization/employees/types';

export type { PermissionOverlay, UserAssignedRole } from '@/features/hr/permissions/hooks/use-user-roles-permissions-model';

export function useEmployeeProfilePermissions(employee: Employee, enabled = true) {
  const userId = employee.userId ?? null;
  const hasLinkedUser = employee.hasUser ?? !!userId;

  return useUserRolesPermissionsModel({
    userId,
    enabled: enabled && hasLinkedUser,
    hasLinkedUser,
    resolveCompanyId: () => resolveEmployeeCompanyId(employee.id),
    assignErrorContext: 'userRole.assign',
  });
}

export type EmployeePermissionsModel = ReturnType<typeof useEmployeeProfilePermissions>;
