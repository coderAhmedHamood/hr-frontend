import { Suspense } from 'react';
import { PosSalesPage } from '@/features/pos/components/admin/pos-sales-page';

export default function Page() {
  return (
    <Suspense>
      <PosSalesPage />
    </Suspense>
  );
}
