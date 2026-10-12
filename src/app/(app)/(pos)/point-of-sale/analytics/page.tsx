import { Suspense } from 'react';
import { PosAnalyticsPage } from '@/features/pos/components/admin/pos-analytics-page';

export default function Page() {
  return (
    <Suspense>
      <PosAnalyticsPage />
    </Suspense>
  );
}
