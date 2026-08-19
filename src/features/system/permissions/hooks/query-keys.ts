export const PERMISSIONS_KEYS = {
  applications: ['applications'] as const,
  allPages: (companyId?: string | null) => ['permissions', 'all-pages', companyId ?? ''] as const,
  byApplication: (applicationId: string | null, companyId?: string | null) =>
    ['permissions', 'by-application', applicationId, companyId ?? ''] as const,
  catalog: (companyId?: string | null) => ['permissions', 'catalog', companyId ?? ''] as const,
  roles: ['roles'] as const,
  rolePermissionsAll: ['role-permissions'] as const,
  rolePermissions: (roleId: string | null) => ['role-permissions', roleId] as const,
  usersList: ['users', 'list'] as const,
  roleUsers: (roleId: string | null) => ['role-users', roleId] as const,
  userRoles: (userId: string | null) => ['user-roles', userId] as const,
  userPermissions: (userId: string | null) => ['user-permissions', userId] as const,
} as const;
