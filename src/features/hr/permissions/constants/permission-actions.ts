export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  read: 'عرض',
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  export: 'تصدير',
};

export type PermissionActionBadgeVariant =
  | 'subtle'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'gold'
  | 'outline';

export function permissionActionLabel(action: string | null | undefined): string {
  if (!action) return '—';
  return PERMISSION_ACTION_LABELS[action] ?? action;
}

export function permissionActionBadgeVariant(
  action: string | null | undefined,
): PermissionActionBadgeVariant {
  switch (action) {
    case 'create':
      return 'success';
    case 'update':
      return 'warning';
    case 'delete':
      return 'destructive';
    case 'approve':
      return 'gold';
    case 'export':
      return 'outline';
    default:
      return 'subtle';
  }
}
