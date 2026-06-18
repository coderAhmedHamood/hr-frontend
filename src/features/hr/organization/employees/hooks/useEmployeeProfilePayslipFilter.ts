'use client';

import * as React from 'react';
import type { Payslip } from '@/features/hr/payroll/types';

const PAYSLIP_MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
] as const;

export function useEmployeeProfilePayslipFilter(employeePayslipSeries: Payslip[]) {
  const payslipDistinctYears = React.useMemo(
    () => new Set(employeePayslipSeries.map((p) => p.year)).size,
    [employeePayslipSeries],
  );

  // Derive available years from real data instead of a fixed range
  const availableYears = React.useMemo(() => {
    const years = [...new Set(employeePayslipSeries.map((p) => p.year))].sort((a, b) => b - a);
    return years.length > 0 ? years : [new Date().getFullYear()];
  }, [employeePayslipSeries]);

  const payslipPeriodOptions = React.useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'كل الكشوف' }];
    for (const y of availableYears) {
      opts.push({ value: `year:${y}`, label: `سنة ${y} — كل الأشهر` });
      for (let i = 11; i >= 0; i--) {
        const monthAr = PAYSLIP_MONTHS_AR[i];
        opts.push({
          value: `${y}-${String(i + 1).padStart(2, '0')}`,
          label: `${monthAr} ${y}`,
        });
      }
    }
    return opts;
  }, [availableYears]);

  const [payslipPeriod, setPayslipPeriod] = React.useState<string>('all');

  const payslipsFiltered = React.useMemo(() => {
    if (payslipPeriod === 'all') return employeePayslipSeries;
    if (payslipPeriod.startsWith('year:')) {
      const y = parseInt(payslipPeriod.slice(5), 10);
      if (!Number.isFinite(y)) return employeePayslipSeries;
      return employeePayslipSeries.filter((p) => p.year === y);
    }
    const parts = payslipPeriod.split('-');
    const y = parseInt(parts[0] ?? '', 10);
    const m = parseInt(parts[1] ?? '', 10);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return employeePayslipSeries;
    return employeePayslipSeries.filter((p) => {
      if (p.year !== y) return false;
      const idx = PAYSLIP_MONTHS_AR.indexOf(p.month as (typeof PAYSLIP_MONTHS_AR)[number]);
      return idx >= 0 && idx + 1 === m;
    });
  }, [employeePayslipSeries, payslipPeriod]);

  return {
    payslipDistinctYears,
    payslipPeriodOptions,
    payslipPeriod,
    setPayslipPeriod,
    payslipsFiltered,
  };
}
