import { Suspense } from 'react';
import { PayrollSalaryApprovalClient } from '@/features/hr/payroll/payroll-salary-approvals/components/payroll-salary-approval-client';

export default function PayrollSalaryApprovalsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-14 rounded-xl bg-muted/40" />
          <div className="h-12 max-w-md rounded-lg bg-muted/30" />
          <div className="h-48 rounded-xl bg-muted/30" />
        </div>
      }
    >
      <PayrollSalaryApprovalClient />
    </Suspense>
  );
}
