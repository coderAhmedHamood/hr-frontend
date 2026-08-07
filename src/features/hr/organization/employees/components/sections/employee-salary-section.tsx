'use client';

import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeSalaryPayslipCards } from '@/features/hr/organization/employees/components/sections/employee-salary-payslip-cards';

export function EmployeeSalarySection({ model }: { model: EmployeeProfileModel }) {
  return (
    <section className="space-y-5">
      <EmployeeSalaryPayslipCards
        employeePayslipSeries={model.employeePayslipSeries}
        salaryAttachments={model.salaryAttachments}
        salaryAttachmentsLoading={model.salaryAttachmentsLoading}
        onOpenAttachment={model.setDetailAttachment}
      />
    </section>
  );
}
