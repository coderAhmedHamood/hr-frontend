'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { EMPLOYEE_PROFILE_SECTIONS } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import type { EmployeeProfileSectionId } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import { useEmployeeProfileData } from '@/features/hr/organization/employees/hooks/useEmployeeProfileData';
import { useEmployeeProfileLeave } from '@/features/hr/organization/employees/hooks/useEmployeeProfileLeave';
import { useEmployeeProfilePersonal } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePersonal';
import { useEmployeeProfileRosePdf } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRosePdf';
import { useEmployeeProfilePermissions } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePermissions';
import { useEmployeeCreateUser } from '@/features/hr/organization/employees/hooks/useEmployeeCreateUser';
import { useEmployeeLinkUser } from '@/features/hr/organization/employees/hooks/useEmployeeLinkUser';
import { useEmployeeProfileAssignments } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAssignments';
import { useEmployeeProfileRequests } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRequests';
import { useEmployeeProfileAuditLog } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAuditLog';

const SECTIONS = EMPLOYEE_PROFILE_SECTIONS;

function employeeHasLinkedUser(employee: Employee): boolean {
  return employee.hasUser ?? !!employee.userId;
}

export function useEmployeeProfileModel(employee: Employee, onUpdated?: (updated: Employee) => void) {
  const [activeSection, setActiveSection] = React.useState<EmployeeProfileSectionId>('personal');
  const contentRef = React.useRef<HTMLElement | null>(null);

  const hasLinkedUser = employeeHasLinkedUser(employee);

  const visibleSections = React.useMemo(
    () => (hasLinkedUser
      ? SECTIONS
      : SECTIONS.filter((s) => s.id !== 'permissions')),
    [hasLinkedUser],
  );

  React.useEffect(() => {
    if (!hasLinkedUser && activeSection === 'permissions') {
      setActiveSection('personal');
    }
  }, [activeSection, hasLinkedUser]);

  const handleUserCreated = React.useCallback(
    (userId: string) => {
      onUpdated?.({ ...employee, hasUser: true, userId });
    },
    [employee, onUpdated],
  );

  const data = useEmployeeProfileData(employee, activeSection);
  const leave = useEmployeeProfileLeave(employee, activeSection === 'leaves');
  const personal = useEmployeeProfilePersonal(employee, activeSection, onUpdated);
  const rose = useEmployeeProfileRosePdf(personal.draft);
  const permissions = useEmployeeProfilePermissions(
    employee,
    hasLinkedUser && activeSection === 'permissions',
  );
  const createUser = useEmployeeCreateUser(employee, handleUserCreated);
  const linkUser = useEmployeeLinkUser(employee, handleUserCreated);
  const assignments = useEmployeeProfileAssignments(employee, activeSection === 'employment');
  const requests = useEmployeeProfileRequests(employee, activeSection === 'requests');
  const auditLog = useEmployeeProfileAuditLog(employee, activeSection === 'activity-log');

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const counts: Partial<Record<EmployeeProfileSectionId, number>> = {
    requests: requests.requestsCounts.total,
    violations: data.violationsTotal,
    contracts: data.employeeContracts.length,
    'rose-forms': data.roseFormsCount,
    'activity-log': auditLog.auditCounts.total,
    salary: data.employeePayslipSeries.length,
    leaves: leave.totalLeaveRequestCount,
    employment: assignments.hrAssignments.length,
  };

  return {
    employee,
    // `hasLinkedUser` comes from the `...permissions` spread below (same
    // `employee.hasUser ?? !!employee.userId` formula) — not re-listed here
    // to avoid a duplicate-key overwrite.
    SECTIONS: visibleSections,
    activeSection,
    setActiveSection,
    contentRef,
    counts,
    ...data,
    ...leave,
    ...personal,
    ...rose,
    ...permissions,
    ...createUser,
    ...linkUser,
    ...assignments,
    ...requests,
    ...auditLog,
  };
}

export type EmployeeProfileModel = ReturnType<typeof useEmployeeProfileModel>;
