import type { EmployeeAuditRowInput } from '@/features/hr/organization/employees/lib/employee-audit-log/types';
import { useEmployeeAuditLogStore } from '@/features/hr/organization/employees/lib/employee-audit-log/store';

export function appendEmployeeAudit(targetEmployeeId: string, rows: EmployeeAuditRowInput[]) {
  useEmployeeAuditLogStore.getState().append(targetEmployeeId, rows);
}
