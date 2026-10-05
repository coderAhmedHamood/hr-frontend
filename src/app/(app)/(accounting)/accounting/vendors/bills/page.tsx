import * as React from 'react';
import { VendorBillsDirectoryPage } from '@/features/accounting/vendor-bills/components/vendor-bills-directory-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <VendorBillsDirectoryPage />
    </React.Suspense>
  );
}
