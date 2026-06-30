'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useHRPayrollPeriodsStore } from '@/features/hr/payroll/lib/payroll-periods-store';
import { PayrollMultiPeriodExplorer } from './payroll-multi-period-explorer';

export function ReportsClient() {
  const fetchPeriodsCatalog = useHRPayrollPeriodsStore((s) => s.fetchCatalog);

  React.useEffect(() => {
    void fetchPeriodsCatalog();
  }, [fetchPeriodsCatalog]);

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-fade-in">
      <SetPageTitle titleAr="مسير الرواتب" descriptionAr="إنشاء وطباعة تقارير مسيرات الرواتب وتصديرها PDF" iconName="FileText" />
      <PayrollMultiPeriodExplorer />
    </div>
  );
}
