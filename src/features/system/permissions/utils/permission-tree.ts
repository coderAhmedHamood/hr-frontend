import type { PermissionResponseDto } from '@/features/system/permissions/lib/api/permissions';
import { permissionActionLabel } from '@/features/system/permissions/constants/permission-actions';

export type PermissionTreeNode = PermissionResponseDto & { children: PermissionTreeNode[] };

export function buildPermissionTree(items: PermissionResponseDto[]): PermissionTreeNode[] {
  const nodes = new Map<string, PermissionTreeNode>();
  for (const item of items) {
    nodes.set(item.id, { ...item, children: [] });
  }

  const roots: PermissionTreeNode[] = [];
  for (const item of items) {
    const node = nodes.get(item.id)!;
    if (item.parentId && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list: PermissionTreeNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
    list.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export function collectActionIdsFromTree(nodes: PermissionTreeNode[]): string[] {
  return nodes.flatMap((node) => collectActionIdsFromNode(node));
}

export function collectActionIdsFromNode(node: PermissionTreeNode): string[] {
  if (node.nodeType === 'ACTION') return [node.id];
  return node.children.flatMap((child) => collectActionIdsFromNode(child));
}

export type PermissionResourceBlock = {
  id: string;
  title: string;
  resource: string | null;
  actions: PermissionTreeNode[];
};

/** Flattens a module subtree into resource cards (group + its direct actions). */
export function collectResourceBlocks(node: PermissionTreeNode): PermissionResourceBlock[] {
  const blocks: PermissionResourceBlock[] = [];

  const walk = (current: PermissionTreeNode) => {
    const directActions = current.children.filter((c) => c.nodeType === 'ACTION');
    const groups = current.children.filter((c) => c.nodeType === 'GROUP');

    if (directActions.length > 0) {
      blocks.push({
        id: current.id,
        title: current.nameAr,
        resource: current.resource,
        actions: directActions,
      });
    }

    groups.forEach(walk);
  };

  walk(node);
  return blocks;
}

export function countActionsInNode(node: PermissionTreeNode): number {
  return collectActionIdsFromNode(node).length;
}

export function filterPermissionTree(
  nodes: PermissionTreeNode[],
  query: string,
): PermissionTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const matches = (node: PermissionTreeNode) =>
    node.nameAr.toLowerCase().includes(q)
    || node.code.toLowerCase().includes(q)
    || (node.resource?.toLowerCase().includes(q) ?? false)
    || (node.action?.toLowerCase().includes(q) ?? false)
    || (node.action ? permissionActionLabel(node.action).includes(q) : false);

  const filterNode = (node: PermissionTreeNode): PermissionTreeNode | null => {
    if (matches(node)) return { ...node, children: node.children };

    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is PermissionTreeNode => child !== null);

    if (filteredChildren.length === 0) return null;
    return { ...node, children: filteredChildren };
  };

  return nodes
    .map(filterNode)
    .filter((node): node is PermissionTreeNode => node !== null);
}
