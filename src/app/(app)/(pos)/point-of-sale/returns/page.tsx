import { Suspense } from 'react';
import { PosReturnsPage } from '@/features/pos/components/admin/pos-returns-page';

export default function Page() {
  return (
    <Suspense>
      <PosReturnsPage />
    </Suspense>
  );
}
