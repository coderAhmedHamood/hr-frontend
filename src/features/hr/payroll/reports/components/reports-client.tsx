'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useHRContractsStore } from '@/features/hr/contracts/lib/contracts-store';
import { useHRPayrollPeriodsStore } from '@/features/hr/payroll/lib/payroll-periods-store';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import { PayrollMultiPeriodExplorer } from './payroll-multi-period-explorer';

export function ReportsClient() {
  const { contracts, fetch: fetchContracts } = useHRContractsStore();
  const periods = useHRPayrollPeriodsStore((s) => s.periods);
  const fetchPeriods = useHRPayrollPeriodsStore((s) => s.fetch);
  const materializePeriodLines = useHRPayrollPeriodsStore((s) => s.materializeFromContracts);
  const fetchAllowanceTypes = useHRAllowanceTypesStore((s) => s.fetch);

  React.useEffect(() => {
    fetchContracts();
    fetchPeriods();
    fetchAllowanceTypes();
  }, [fetchContracts, fetchPeriods, fetchAllowanceTypes]);

  React.useEffect(() => {
    if (periods.length > 0 && contracts.length > 0) {
      materializePeriodLines(contracts);
    }
  }, [periods.length, contracts, materializePeriodLines]);

  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="مسير الرواتب" descriptionAr="إنشاء وطباعة تقارير مسيرات الرواتب وتصديرها PDF" iconName="FileText" />
      <PayrollMultiPeriodExplorer />
    </div>
  );
}
