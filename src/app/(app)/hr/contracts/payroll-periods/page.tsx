import { redirect } from 'next/navigation';
import { hrPayrollRoutes } from '@/features/hr/payroll/constants/routes';

export default function LegacyContractsPayrollPeriodsRedirectPage() {
  redirect(hrPayrollRoutes.payrollPeriods);
}
