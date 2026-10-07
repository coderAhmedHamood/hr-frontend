import { Suspense } from 'react';
import { PosReportsPage } from '@/features/pos/components/admin/pos-reports-page';

export default function Page() {
  return (
    <Suspense>
      <PosReportsPage />
    </Suspense>
  );
}
