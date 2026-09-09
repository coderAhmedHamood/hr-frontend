import * as React from 'react';
import { VendorsListPage } from '@/features/accounting/vendors/components/vendors-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorsListPage />
    </React.Suspense>
  );
}
