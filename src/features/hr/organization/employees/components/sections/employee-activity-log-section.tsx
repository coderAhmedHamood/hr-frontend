'use client';

import { EmployeeAuditLogPanel } from '@/features/hr/organization/employees/components/employee-audit-log-panel';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeActivityLogSection({ model }: { model: EmployeeProfileModel }) {
  return <EmployeeAuditLogPanel audit={model} />;
}
