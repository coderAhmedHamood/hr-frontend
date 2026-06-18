import { rolesApi, type RoleResponseDto } from '@/features/hr/permissions/lib/api/roles';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

function generateCode(): string {
  return `role_${Date.now().toString(36)}`;
}

// ── Kept for unit tests (key ↔ id mapping helpers) ───────────────────────────
export function resolvePermissionIds(
  keys: string[],
  all: PermissionResponseDto[],
): string[] {
  const actionNodes = all.filter((p) => p.nodeType === 'ACTION');
  if (keys.includes('all')) return actionNodes.map((p) => p.id);
  return keys.flatMap((key) => {
    const [resource, action] = key.split('.');
    const match = actionNodes.find((p) => {
      if (p.resource && p.action) return p.resource === resource && p.action === action;
      const parts = p.code.split('.');
      return parts.at(-2) === resource && parts.at(-1) === action;
    });
    return match ? [match.id] : [];
  });
}

export function resolvePermissionKeys(
  permissionIds: string[],
  all: PermissionResponseDto[],
): string[] {
  return permissionIds.flatMap((id) => {
    const p = all.find((x) => x.id === id);
    if (!p) return [];
    if (p.resource && p.action) return [`${p.resource}.${p.action}`];
    const parts = p.code.split('.');
    if (parts.length >= 2) return [`${parts.at(-2)}.${parts.at(-1)}`];
    return [];
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export type RoleFormData = {
  name: string;
  description: string;
  /** Permission IDs (not string keys) — already scoped to the correct application */
  permissionIds: string[];
  companyId: string;
  applicationId: string;
  /** Optional actor label for bulk permission links */
  createdBy?: string | null;
};

export async function createRoleWithPermissions(
  data: RoleFormData,
): Promise<RoleResponseDto> {
  const role = await rolesApi.create({
    nameAr: data.name,
    nameEn: '',
    code: generateCode(),
    description: data.description || undefined,
    companyId: data.companyId,
    applicationId: data.applicationId,
  });

  if (data.permissionIds.length > 0) {
    await rolesApi.bulkAssignPermissions(role.id, data.permissionIds, data.createdBy);
  }
  return role;
}

export async function updateRoleWithPermissions(
  roleId: string,
  data: Pick<RoleFormData, 'name' | 'description' | 'permissionIds' | 'createdBy'>,
): Promise<RoleResponseDto> {
  const [role, currentResult] = await Promise.all([
    rolesApi.update(roleId, { nameAr: data.name, description: data.description || undefined }),
    rolesApi.getPermissions(roleId),
  ]);

  const current = currentResult.items ?? [];
  const desiredSet = new Set(data.permissionIds);
  const currentIdMap = new Map(current.map((p) => [p.permissionId, p.id]));

  const toRemove = current.filter((p) => !desiredSet.has(p.permissionId));
  const toAdd = data.permissionIds.filter((id) => !currentIdMap.has(id));

  await Promise.all([
    ...toRemove.map((p) => rolesApi.removePermission(p.id)),
    toAdd.length > 0
      ? rolesApi.bulkAssignPermissions(roleId, toAdd, data.createdBy)
      : Promise.resolve(),
  ]);

  return role;
}

export type RoleForEdit = {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
};

export async function loadRoleForEdit(roleId: string): Promise<RoleForEdit> {
  const [role, permsResult] = await Promise.all([
    rolesApi.getById(roleId),
    rolesApi.getPermissions(roleId),
  ]);

  return {
    id: role.id,
    name: role.nameAr ?? role.name ?? '',
    description: role.description ?? '',
    permissionIds: (permsResult.items ?? []).map((p) => p.permissionId),
  };
}

export async function deleteRoleById(roleId: string): Promise<void> {
  await rolesApi.delete(roleId);
}
