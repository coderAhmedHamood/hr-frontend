'use client';

import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeSalaryPayslipCards } from '@/features/hr/organization/employees/components/sections/employee-salary-payslip-cards';

export function EmployeeSalarySection({ model }: { model: EmployeeProfileModel }) {
  const {
    employeePayslipSeries,
    payslipCounts,
    payslipDistinctYears,
    payslipPeriod,
    setPayslipPeriod,
    payslipPeriodOptions,
    payslipsFiltered,
  } = model;

  return (
    <section className="space-y-5">
      <EmployeeSalaryPayslipCards
        employeePayslipSeries={employeePayslipSeries}
        payslipCounts={payslipCounts}
        payslipDistinctYears={payslipDistinctYears}
        payslipPeriod={payslipPeriod}
        setPayslipPeriod={setPayslipPeriod}
        payslipPeriodOptions={payslipPeriodOptions}
        payslipsFiltered={payslipsFiltered}
      />
    </section>
  );
}
