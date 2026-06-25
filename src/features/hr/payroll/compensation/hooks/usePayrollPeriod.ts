import { useQuery } from '@tanstack/react-query';
import { payrollPeriodsApi } from '@/features/hr/payroll/lib/api/payroll-periods';
import { mapPayrollPeriodFromApi } from '@/features/hr/payroll/lib/payroll-periods-store';
import { PAYROLL_PERIOD_KEYS } from './query-keys';

export function usePayrollPeriod(periodId: string | null | undefined) {
  return useQuery({
    queryKey: PAYROLL_PERIOD_KEYS.detail(periodId ?? ''),
    queryFn: async () => {
      const dto = await payrollPeriodsApi.get(periodId!);
      return mapPayrollPeriodFromApi(dto);
    },
    enabled: Boolean(periodId),
    staleTime: 5 * 60 * 1000,
  });
}
