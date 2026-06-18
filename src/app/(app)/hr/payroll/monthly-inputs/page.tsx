import { Suspense } from 'react';
import { MonthlyInputsPage } from '@/features/hr/payroll/monthly-inputs/components/monthly-inputs-page';

export default function PayrollMonthlyInputsRoutePage() {
  return (
    <Suspense fallback={null}>
      <MonthlyInputsPage />
    </Suspense>
  );
}
