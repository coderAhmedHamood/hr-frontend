import type { Employee } from '@/features/hr/organization/employees/types';

/** دور النظام كما في mock-data؛ `color` مفتاح لون من توكنات التصميم (مثل primary، destructive). */
export interface SystemRoleRecord {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
  color: string;
}

const RESOURCE_AR: Record<string, string> = {
  employees: 'الموظفين',
  attendance: 'الحضور',
  requests: 'الطلبات',
  payroll: 'الرواتب',
  hr: 'الموارد البشرية',
  reports: 'التقارير',
  settings: 'الإعدادات',
  self: 'البيانات الشخصية',
  team: 'الفريق',
};

const ACTION_AR: Record<string, string> = {
  view: 'عرض',
  create: 'إنشاء',
  edit: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  self: 'ذاتي',
  team: 'الفريق',
};

/** افتراض الدور من الحقل الوظيفي القديم `role` عند عدم وجود `assignedRoleId` */
export function inferAssignedRoleId(jobRole: string): string {
  switch (jobRole) {
    case 'hr-manager':
      return 'r2';
    case 'department-manager':
      return 'r4';
    default:
      return 'r5';
  }
}

export function effectiveAssignedRoleId(employee: Employee): string {
  return employee.assignedRoleId ?? inferAssignedRoleId(employee.role);
}

/** تسمية عربية لمفتاح الصلاحية كما في مصفوفة الدور */
export function permissionLabelAr(key: string): string {
  if (key === 'all') return 'صلاحيات كاملة على جميع وحدات النظام';
  if (key.endsWith('.*')) {
    const res = key.slice(0, -2);
    const rn = RESOURCE_AR[res] ?? res;
    return `جميع صلاحيات ${rn}`;
  }
  const parts = key.split('.');
  if (parts.length >= 2) {
    const res = RESOURCE_AR[parts[0]] ?? parts[0];
    const rest = parts.slice(1);
    const tail = rest
      .map((p) => ACTION_AR[p] ?? p)
      .join(' — ');
    return `${tail} (${res})`;
  }
  return key;
}

export function permissionsForRole(roleId: string, roles: SystemRoleRecord[]): string[] {
  return roles.find((r) => r.id === roleId)?.permissions ?? [];
}
