import * as React from 'react';
import { VendorBillsListPage } from '@/features/accounting/vendor-bills/components/vendor-bills-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorBillsListPage />
    </React.Suspense>
  );
}
