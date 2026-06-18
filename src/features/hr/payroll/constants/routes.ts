export const HR_PAYROLL_BASE = '/hr/payroll' as const;

export function hrPayrollSectionHref(segment: string): string {
  return `${HR_PAYROLL_BASE}/${segment}`;
}

export function hrPayrollPeriodCompensationHref(periodId: string): string {
  return `${HR_PAYROLL_BASE}/period/${encodeURIComponent(periodId)}/compensation`;
}

export const hrPayrollRoutes = {
  root: HR_PAYROLL_BASE,
  payrollPeriods: hrPayrollSectionHref('payroll-periods'),
  monthlyInputs: hrPayrollSectionHref('monthly-inputs'),
  payrollSalaryApprovals: hrPayrollSectionHref('payroll-salary-approvals'),
  reports: hrPayrollSectionHref('reports'),
} as const;

export function hrPayrollSalaryApprovalsQueryHref(periodId: string): string {
  return `${hrPayrollRoutes.payrollSalaryApprovals}?period=${encodeURIComponent(periodId)}`;
}
