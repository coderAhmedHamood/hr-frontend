import { redirect } from 'next/navigation';
import { hrPayrollPeriodCompensationHref } from '@/features/hr/payroll/constants/routes';

interface Props { params: Promise<{ periodId: string }> }

export default async function LegacyContractsPeriodRootRedirectPage({ params }: Props) {
  const { periodId } = await params;
  redirect(hrPayrollPeriodCompensationHref(periodId));
}
