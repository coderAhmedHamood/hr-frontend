'use client';

import { useParams } from 'next/navigation';
import { CompensationReportPanel } from '@/features/hr/payroll/compensation/components/compensation-report-panel';

export function CompensationReportRouteClient() {
  const { periodId } = useParams<{ periodId: string }>();
  return <CompensationReportPanel periodId={periodId} />;
}
