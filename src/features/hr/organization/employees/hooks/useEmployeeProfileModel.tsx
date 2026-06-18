'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { EMPLOYEE_PROFILE_SECTIONS } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import type { EmployeeProfileSectionId } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import { useEmployeeProfileData } from '@/features/hr/organization/employees/hooks/useEmployeeProfileData';
import { useEmployeeProfilePayslipFilter } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePayslipFilter';
import { useEmployeeProfileLeave } from '@/features/hr/organization/employees/hooks/useEmployeeProfileLeave';
import { useEmployeeProfilePersonal } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePersonal';
import { useEmployeeProfileRosePdf } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRosePdf';
import { useEmployeeProfilePermissions } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePermissions';
import { useEmployeeCreateUser } from '@/features/hr/organization/employees/hooks/useEmployeeCreateUser';
import { useEmployeeProfileAssignments } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAssignments';
import { useEmployeeProfileRequests } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRequests';

const SECTIONS = EMPLOYEE_PROFILE_SECTIONS;

export function useEmployeeProfileModel(employee: Employee, onUpdated?: (updated: Employee) => void) {
  const [activeSection, setActiveSection] = React.useState<EmployeeProfileSectionId>('personal');
  const contentRef = React.useRef<HTMLElement | null>(null);

  const handleUserCreated = React.useCallback(
    (userId: string) => {
      onUpdated?.({ ...employee, hasUser: true, userId });
    },
    [employee, onUpdated],
  );

  const data = useEmployeeProfileData(employee, activeSection);
  const payslip = useEmployeeProfilePayslipFilter(data.employeePayslipSeries);
  const leave = useEmployeeProfileLeave(employee, activeSection === 'leaves');
  const personal = useEmployeeProfilePersonal(employee, activeSection, onUpdated);
  const rose = useEmployeeProfileRosePdf(personal.draft);
  const permissions = useEmployeeProfilePermissions(employee, activeSection === 'permissions');
  const createUser = useEmployeeCreateUser(employee, handleUserCreated);
  const assignments = useEmployeeProfileAssignments(employee, activeSection === 'employment');
  const requests = useEmployeeProfileRequests(employee, activeSection === 'requests');

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const counts: Partial<Record<EmployeeProfileSectionId, number>> = {
    requests: requests.requestsCounts.total,
    violations: data.violationsTotal,
    contracts: data.employeeContracts.length,
    'rose-forms': data.roseFormsCount,
    'activity-log': data.activityLogCount,
    salary: data.employeePayslipSeries.length,
    leaves: leave.totalLeaveRequestCount,
    employment: assignments.hrAssignments.length,
  };

  return {
    employee,
    SECTIONS,
    activeSection,
    setActiveSection,
    contentRef,
    counts,
    ...data,
    ...payslip,
    ...leave,
    ...personal,
    ...rose,
    ...permissions,
    ...createUser,
    ...assignments,
    ...requests,
  };
}

export type EmployeeProfileModel = ReturnType<typeof useEmployeeProfileModel>;
