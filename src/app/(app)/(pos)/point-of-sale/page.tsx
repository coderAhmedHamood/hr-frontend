import { Suspense } from 'react';
import { PosOverviewPage } from '@/features/pos/components/admin/pos-overview-page';

export default function Page() {
  return (
    <Suspense>
      <PosOverviewPage />
    </Suspense>
  );
}
