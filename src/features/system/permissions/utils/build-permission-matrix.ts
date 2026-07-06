import type { PermissionResponseDto } from '@/features/system/permissions/lib/api/permissions';

const ACTION_ORDER = ['read', 'create', 'update', 'delete', 'approve', 'export'] as const;

export type PermissionMatrix = {
  resources: string[];
  actionIds: string[];
  matrix: Record<string, Record<string, string>>;
  resourceLabels: Record<string, string>;
  permissionLabels: Record<string, string>;
};

/** Builds the role-form matrix from GET /permissions ACTION nodes. */
export function buildPermissionMatrix(
  availablePermissions: PermissionResponseDto[],
): PermissionMatrix {
  const byId = new Map(availablePermissions.map((p) => [p.id, p]));
  const actionNodes = availablePermissions.filter((p) => p.nodeType === 'ACTION');

  const resourceSet = new Set<string>();
  const actionSet = new Set<string>();
  const resourceSortOrder = new Map<string, number>();

  for (const node of actionNodes) {
    if (node.resource) {
      resourceSet.add(node.resource);
      const current = resourceSortOrder.get(node.resource);
      if (current === undefined || node.sortOrder < current) {
        resourceSortOrder.set(node.resource, node.sortOrder);
      }
    }
    if (node.action) actionSet.add(node.action);
  }

  const resourceLabels: Record<string, string> = {};
  for (const action of actionNodes) {
    if (!action.resource || resourceLabels[action.resource]) continue;

    const groupWithResource = availablePermissions.find(
      (p) => p.nodeType === 'GROUP' && p.resource === action.resource && p.nameAr,
    );
    if (groupWithResource?.nameAr) {
      resourceLabels[action.resource] = groupWithResource.nameAr;
      continue;
    }

    let parent = action.parentId ? byId.get(action.parentId) : undefined;
    while (parent) {
      if (parent.nodeType === 'GROUP' && parent.nameAr) {
        resourceLabels[action.resource] = parent.nameAr;
        break;
      }
      parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }

    if (!resourceLabels[action.resource]) {
      resourceLabels[action.resource] = action.resource;
    }
  }

  const actionIds = [...actionSet].sort(
    (a, b) =>
      (ACTION_ORDER.indexOf(a as (typeof ACTION_ORDER)[number]) === -1
        ? 99
        : ACTION_ORDER.indexOf(a as (typeof ACTION_ORDER)[number])) -
      (ACTION_ORDER.indexOf(b as (typeof ACTION_ORDER)[number]) === -1
        ? 99
        : ACTION_ORDER.indexOf(b as (typeof ACTION_ORDER)[number])),
  );

  const matrix: Record<string, Record<string, string>> = {};
  const permissionLabels: Record<string, string> = {};
  for (const resource of resourceSet) {
    matrix[resource] = {};
    for (const action of actionIds) {
      const match = actionNodes.find((n) => n.resource === resource && n.action === action);
      if (match) {
        matrix[resource][action] = match.id;
        permissionLabels[match.id] = match.nameAr ?? match.code;
      }
    }
  }

  const resources = [...resourceSet].sort(
    (a, b) => (resourceSortOrder.get(a) ?? 0) - (resourceSortOrder.get(b) ?? 0),
  );

  return { resources, actionIds, matrix, resourceLabels, permissionLabels };
}
