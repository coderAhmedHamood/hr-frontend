import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import { resolvePrimaryAssignment } from '@/features/hr/organization/employees/services/employee-assignments.service';
import type { EnrichedEmployeeAssignment } from '@/features/hr/organization/employees/services/employee-assignments.service';

export type EmployeeAssignmentCompanyContext = {
  companyId: string;
  companyLabel: string;
};

/** Company for a new assignment — primary assignment first, then default login company. */
export function resolveAssignmentCompanyContextFromProfile(options: {
  primaryAssignment: EnrichedEmployeeAssignment | null;
  defaultCompanyId: string | null;
}): EmployeeAssignmentCompanyContext | null {
  const companyId = options.primaryAssignment?.companyId ?? options.defaultCompanyId;
  if (!companyId) return null;

  const labelFromAssignment = options.primaryAssignment?.companyNameAr;
  const companyLabel =
    labelFromAssignment && labelFromAssignment !== '—'
      ? labelFromAssignment
      : 'الشركة النشطة';

  return { companyId, companyLabel };
}

/** Company id from the employee's primary/active HR assignment. */
export async function resolveEmployeeCompanyId(employeeId: string): Promise<string> {
  const assignments = await employeeAssignmentsApi.getAll(employeeId);
  const list = Array.isArray(assignments) ? assignments : [];
  const primary = resolvePrimaryAssignment(list);

  if (!primary?.companyId) {
    throw new Error('لا يوجد تعيين شركة نشط لهذا الموظف — أضف تعييناً قبل إدارة الصلاحيات');
  }

  return primary.companyId;
}
