import { rolesApi, type RoleResponseDto } from '@/features/system/permissions/lib/api/roles';
import { userRolesApi } from '@/features/system/permissions/lib/api/user-roles';
import { loadAllPermissionsForCompany } from '@/features/system/permissions/services/permissions.service';
import { createRoleWithPermissions } from '@/features/system/permissions/services/roles.service';
import type { SystemOwnerCompanyApplication } from '@/features/system-owner/lib/api/system-owner';

const SKIP_APP_CODES = new Set(['company-apps', 'system-owner']);

function isInventoryApp(code: string) {
  const normalized = code.trim().toLowerCase();
  return normalized === 'inventory' || normalized === 'inv' || normalized === 'warehouse';
}

function appIdOf(app: SystemOwnerCompanyApplication) {
  return app.applicationId || app.id;
}

function looksLikeFullAccessRole(role: RoleResponseDto) {
  const hay = `${role.nameAr} ${role.code} ${role.name ?? ''}`.toLowerCase();
  return /كامل|full|superuser|owner/.test(hay);
}

export async function assignRolesToUser(userId: string, companyId: string, roleIds: string[]) {
  const unique = [...new Set(roleIds.filter(Boolean))];
  const results = await Promise.allSettled(
    unique.map((roleId) => userRolesApi.assign(userId, { roleId, isActive: true })),
  );
  const failed = results.filter((row) => row.status === 'rejected').length;
  return { assigned: unique.length - failed, failed, total: unique.length };
}

export async function syncUserRoles(userId: string, companyId: string, nextRoleIds: string[]) {
  const current = await userRolesApi.list(userId);
  const active = (current.items ?? []).filter(
    (row) => row.isActive && (!row.companyId || row.companyId === companyId),
  );
  const currentIds = new Set(active.map((row) => row.roleId));
  const nextSet = new Set(nextRoleIds);
  const toAdd = nextRoleIds.filter((id) => !currentIds.has(id));
  const toRemove = active.filter((row) => !nextSet.has(row.roleId));

  await Promise.all([
    ...toAdd.map((roleId) => userRolesApi.assign(userId, { roleId, isActive: true })),
    ...toRemove.map((row) => userRolesApi.revoke(row.id)),
  ]);
}

export function isAssignableCompanyRole(role: RoleResponseDto, companyId: string) {
  return !role.companyId || role.companyId === companyId;
}

/** Ensures one full-access role per enabled company app, then returns those role ids. */
export async function ensureFullAccessRoleIds(
  companyId: string,
  apps: SystemOwnerCompanyApplication[],
): Promise<string[]> {
  const enabledApps = apps.filter((app) => {
    const code = app.code.trim().toLowerCase();
    if (SKIP_APP_CODES.has(code)) return false;
    return app.isEnabled || code === 'system';
  });

  if (enabledApps.length === 0) return [];

  const [rolesResult, perms] = await Promise.all([
    rolesApi.getAll({ limit: 200 }),
    loadAllPermissionsForCompany(companyId),
  ]);
  const existing = (rolesResult.items ?? []).filter((role) => isAssignableCompanyRole(role, companyId));
  const roleIds: string[] = [];

  for (const app of enabledApps) {
    const applicationId = appIdOf(app);
    if (!applicationId) continue;

    const actionIds = perms.items
      .filter((permission) => permission.applicationId === applicationId && permission.nodeType === 'ACTION')
      .map((permission) => permission.id);
    if (actionIds.length === 0) continue;

    const match = existing.find(
      (role) => role.applicationId === applicationId && looksLikeFullAccessRole(role),
    );
    if (match) {
      roleIds.push(match.id);
      continue;
    }

    const created = await createRoleWithPermissions({
      name: `صلاحيات كاملة — ${app.nameAr}`,
      description: 'أُنشئ من وحدة مالك النظام لمنح صلاحيات التطبيق المفعّل',
      companyId,
      applicationId,
      permissionIds: actionIds,
      isAllBranches: isInventoryApp(app.code),
    });
    existing.push(created);
    roleIds.push(created.id);
  }

  return roleIds;
}
