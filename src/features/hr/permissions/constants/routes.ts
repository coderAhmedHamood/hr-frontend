export const HR_PERMISSIONS_BASE = '/hr/permissions' as const;
export const HR_PERMISSIONS_ROLES = '/hr/permissions/roles' as const;
export const HR_PERMISSIONS_CATALOG = '/hr/permissions/catalog' as const;

export function hrPermissionsRolesHref(): string {
  return HR_PERMISSIONS_ROLES;
}

export function hrPermissionsCatalogHref(): string {
  return HR_PERMISSIONS_CATALOG;
}

/** Default entry — roles management (assign permissions to roles). */
export function hrPermissionsHref(): string {
  return HR_PERMISSIONS_ROLES;
}
