import {
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  PERMISSION_MATRIX_TOTAL,
} from '@/features/system/permissions/constants/permission-matrix';

export function hasPermission(
  permissions: string[],
  resource: string,
  action: string,
): boolean {
  return (
    permissions.includes('all') ||
    permissions.includes(`${resource}.${action}`) ||
    permissions.includes(`${resource}.*`)
  );
}

export function countGrantedPermissions(permissions: string[]): number {
  if (permissions.includes('all')) return PERMISSION_MATRIX_TOTAL;
  return PERMISSION_RESOURCES.reduce(
    (acc, r) =>
      acc + PERMISSION_ACTIONS.filter((a) => hasPermission(permissions, r.id, a.id)).length,
    0,
  );
}

export function expandAllPermissionKeys(): string[] {
  return PERMISSION_RESOURCES.flatMap((r) =>
    PERMISSION_ACTIONS.map((a) => `${r.id}.${a.id}`),
  );
}

export { PERMISSION_MATRIX_TOTAL };
