import { useQuery } from '@tanstack/react-query';
import { payrollPeriodsApi } from '@/features/hr/payroll/lib/api/payroll-periods';
import { PAYROLL_SUMMARY_KEYS } from './query-keys';

export function useEmployeesPayrollSummary(periodId: string | null | undefined) {
  return useQuery({
    queryKey: PAYROLL_SUMMARY_KEYS.byPeriod(periodId ?? ''),
    queryFn: () => payrollPeriodsApi.getEmployeesPayrollSummary(periodId!),
    enabled: Boolean(periodId),
    staleTime: 60_000,
  });
}
