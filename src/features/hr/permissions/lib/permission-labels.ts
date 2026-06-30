import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

export const PERMISSION_RESOURCE_AR: Record<string, string> = {
  employees: 'الموظفين',
  attendance: 'الحضور',
  requests: 'الطلبات',
  payroll: 'الرواتب',
  hr: 'الموارد البشرية',
  reports: 'التقارير',
  settings: 'الإعدادات',
  leaves: 'الإجازات',
  contracts: 'العقود',
  organization: 'المنظمة',
};

export const PERMISSION_ACTION_AR: Record<string, string> = {
  read: 'عرض',
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  export: 'تصدير',
};

export function permissionLabel(p: PermissionResponseDto): string {
  const res = PERMISSION_RESOURCE_AR[p.resource ?? ''] ?? p.resource ?? '';
  const act = PERMISSION_ACTION_AR[p.action ?? ''] ?? p.action ?? '';
  return `${act}${res ? ` (${res})` : ''}`;
}
