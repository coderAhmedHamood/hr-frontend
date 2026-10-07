import { Suspense } from 'react';
import { PosRegistersPage } from '@/features/pos/components/admin/pos-registers-page';

export default function Page() {
  return (
    <Suspense>
      <PosRegistersPage />
    </Suspense>
  );
}
