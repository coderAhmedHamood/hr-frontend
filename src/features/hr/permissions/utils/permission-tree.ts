import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

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
