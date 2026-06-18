import type { EmployeeAssignmentStatusDto } from '@/features/hr/organization/employees/lib/api/employee-assignments';

export const EMPLOYEE_ASSIGNMENT_STATUS_LABELS: Record<EmployeeAssignmentStatusDto, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  ended: 'منتهٍ',
};

export const EMPLOYEE_ASSIGNMENT_STATUS_ORDER: EmployeeAssignmentStatusDto[] = [
  'active',
  'suspended',
  'ended',
];
