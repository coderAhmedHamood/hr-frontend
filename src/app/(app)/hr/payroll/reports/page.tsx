import { Suspense } from 'react';
import { ReportsClient } from '@/features/hr/payroll/reports/components/reports-client';

export default function PayrollReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-14 rounded-xl bg-muted/40" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-96 rounded-xl bg-muted/30" />
            <div className="lg:col-span-2 h-96 rounded-xl bg-muted/30" />
          </div>
        </div>
      }
    >
      <ReportsClient />
    </Suspense>
  );
}
