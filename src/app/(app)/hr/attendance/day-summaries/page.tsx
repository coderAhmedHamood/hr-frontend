import { Suspense } from 'react';
import { DaySummariesPage } from '@/features/hr/attendance/day-summaries/components/day-summaries-page';

export default function AttendanceDaySummariesRoutePage() {
  return (
    <Suspense fallback={null}>
      <DaySummariesPage /> 
    </Suspense>
  );
}
 