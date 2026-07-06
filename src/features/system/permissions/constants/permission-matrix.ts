import {
  Shield,
  Users,
  Clock,
  FileText,
  Wallet,
  Briefcase,
  BarChart2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PermissionResourceDef = { id: string; label: string; icon: LucideIcon };

export const PERMISSION_RESOURCES: PermissionResourceDef[] = [
  { id: 'employees', label: 'الموظفين', icon: Users },
  { id: 'attendance', label: 'الحضور', icon: Clock },
  { id: 'requests', label: 'الطلبات', icon: FileText },
  { id: 'payroll', label: 'الرواتب', icon: Wallet },
  { id: 'hr', label: 'الموارد البشرية', icon: Briefcase },
  { id: 'reports', label: 'التقارير', icon: BarChart2 },
  { id: 'settings', label: 'الصلاحيات', icon: Shield },
];

export const PERMISSION_ACTIONS = [
  { id: 'read', label: 'عرض' },
  { id: 'create', label: 'إنشاء' },
  { id: 'update', label: 'تعديل' },
  { id: 'delete', label: 'حذف' },
  { id: 'approve', label: 'موافقة' },
] as const;

export type PermissionActionId = (typeof PERMISSION_ACTIONS)[number]['id'];

export const PERMISSION_MATRIX_TOTAL =
  PERMISSION_RESOURCES.length * PERMISSION_ACTIONS.length;
