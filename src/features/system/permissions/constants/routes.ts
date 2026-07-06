export const SYSTEM_PERMISSIONS_BASE = '/system/permissions' as const;
export const SYSTEM_PERMISSIONS_ROLES = '/system/permissions/roles' as const;
export const SYSTEM_PERMISSIONS_CATALOG = '/system/permissions/catalog' as const;

export function systemPermissionsRolesHref(): string {
  return SYSTEM_PERMISSIONS_ROLES;
}

export function systemPermissionsCatalogHref(): string {
  return SYSTEM_PERMISSIONS_CATALOG;
}

/** Default entry — roles management (assign permissions to roles). */
export function systemPermissionsHref(): string {
  return SYSTEM_PERMISSIONS_ROLES;
}
