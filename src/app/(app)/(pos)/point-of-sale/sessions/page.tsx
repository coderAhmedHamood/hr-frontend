import { Suspense } from 'react';
import { PosSessionsPage } from '@/features/pos/components/admin/pos-sessions-page';

export default function Page() {
  return (
    <Suspense>
      <PosSessionsPage />
    </Suspense>
  );
}
