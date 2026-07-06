'use client';

import { useUserRolesPermissionsModel } from '@/components/shared/permissions/use-user-roles-permissions-model';
import type { UserResponseDto } from '@/features/hr/organization/lib/api/users';

function resolveUserCompanyId(user: UserResponseDto): string {
  const defaultLink = user.companies.find((c) => c.isDefault && c.isActive);
  const anyLink = user.companies.find((c) => c.isActive);
  const companyId = defaultLink?.companyId ?? anyLink?.companyId ?? user.defaultCompanyId;
  if (!companyId) {
    throw new Error('لا توجد شركة مرتبطة بهذا المستخدم — عيّن شركة أولاً');
  }
  return companyId;
}

export function useUserPermissionsModel(user: UserResponseDto | null, enabled = true) {
  const model = useUserRolesPermissionsModel({
    userId: user?.id ?? null,
    enabled: enabled && !!user,
    hasLinkedUser: Boolean(user),
    resolveCompanyId: async () => {
      if (!user) throw new Error('المستخدم غير متاح');
      return resolveUserCompanyId(user);
    },
    assignErrorContext: 'auth.userRole.assign',
  });

  return {
    ...model,
    hasCompany: Boolean(user?.defaultCompanyId || user?.companies.some((c) => c.isActive)),
  };
}

export type UserPermissionsModel = ReturnType<typeof useUserPermissionsModel>;
