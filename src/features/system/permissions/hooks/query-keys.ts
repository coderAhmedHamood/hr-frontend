export const PERMISSIONS_KEYS = {
  applications: ['applications'] as const,
  allPages: ['permissions', 'all-pages'] as const,
  byApplication: (applicationId: string | null) =>
    ['permissions', 'by-application', applicationId] as const,
  catalog: ['permissions', 'catalog'] as const,
  roles: ['roles'] as const,
  rolePermissionsAll: ['role-permissions'] as const,
  rolePermissions: (roleId: string | null) => ['role-permissions', roleId] as const,
  usersList: ['users', 'list'] as const,
  roleUsers: (roleId: string | null) => ['role-users', roleId] as const,
  userRoles: (userId: string | null) => ['user-roles', userId] as const,
  userPermissions: (userId: string | null) => ['user-permissions', userId] as const,
} as const;
